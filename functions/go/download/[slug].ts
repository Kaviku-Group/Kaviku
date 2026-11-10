// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * GET /go/download/<slug> — засчитать скачивание и выдать игру.
 *
 * - Внешняя ссылка (https://…) — перенаправление на неё.
 * - Файл из папки игры (/downloads/<slug>/<файл>) — функция сама отдаёт его как скачиваемый
 *   файл с исходным именем. В сборке он лежит как «<файл>.dl», поэтому даже HTML-игра
 *   никогда не откроется как страница сайта.
 *
 * Скачивание засчитывается:
 *  - не чаще раза в сутки от одного посетителя (cookie);
 *  - не больше 20 раз в сутки для одной игры из одной сети (хэш IP) — это лишь
 *    дополнительный сигнал против накрутки, разные люди в одной сети считаются отдельно;
 *  - не для ботов и предзагрузки ссылок.
 * Простое открытие страницы игры скачивание не засчитывает.
 */
import type { Ctx, Env } from '../../../server/env';
import { looksLikeBot } from '../../../server/http';
import { getOrCreateVisitor, ipHash } from '../../../server/visitor';
import { today } from '../../../server/rate-limit';
import { isSlug, loadManifest } from '../../../server/games';

const IP_DAILY_LIMIT = 20;

function redirect(location: string, setCookie?: string): Response {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(null, { status: 302, headers });
}

/** Отдаёт файл игры из сборки (/downloads/<slug>/<файл>.dl) как скачиваемый файл с исходным именем. */
async function serveLocalFile(request: Request, env: Env, target: string, setCookie?: string): Promise<Response> {
  const name = decodeURIComponent(target.split('/').pop() ?? 'game');
  const asset = await env.ASSETS.fetch(new URL(`${target}.dl`, request.url).toString());
  if (!asset.ok) return new Response('Файл игры не найден', { status: 404 });
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  });
  const length = asset.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);
  if (setCookie) headers.append('Set-Cookie', setCookie);
  return new Response(asset.body as unknown as BodyInit, { status: 200, headers });
}

export async function onRequestGet({ request, env, params }: Ctx<'slug'>): Promise<Response> {
  const slug = params.slug;
  const gamePage = isSlug(slug) ? `/games/${slug}` : '/';
  if (!isSlug(slug)) return redirect('/');

  let target: string | null = null;
  try {
    const manifest = await loadManifest(request, env);
    target = manifest[slug]?.downloadUrl ?? null;
  } catch (e) {
    console.error('go/download manifest', e);
  }
  // Нет ссылки — возвращаем на страницу игры
  if (!target) return redirect(gamePage);

  const isLocal = target.startsWith(`/downloads/${slug}/`);
  const deliver = (setCookie?: string) => (isLocal ? serveLocalFile(request, env, target!, setCookie) : redirect(target!, setCookie));

  if (looksLikeBot(request)) return deliver();

  try {
    const visitor = await getOrCreateVisitor(request, env);
    const ip = await ipHash(request, env);
    const day = today();

    const fromIp = await env.DB.prepare('SELECT COUNT(*) AS n FROM downloads WHERE slug = ? AND ip_hash = ? AND day = ?')
      .bind(slug, ip, day)
      .first<{ n: number }>();

    if ((fromIp?.n ?? 0) < IP_DAILY_LIMIT) {
      const inserted = await env.DB.prepare('INSERT OR IGNORE INTO downloads (slug, visitor_id, day, ip_hash) VALUES (?, ?, ?, ?)')
        .bind(slug, visitor.id, day, ip)
        .run();
      if (inserted.meta.changes > 0) {
        await env.DB.prepare(
          `INSERT INTO game_stats (slug, downloads) VALUES (?, 1)
           ON CONFLICT(slug) DO UPDATE SET downloads = downloads + 1`,
        )
          .bind(slug)
          .run();
      }
    }
    return deliver(visitor.setCookie);
  } catch (e) {
    // Даже если учёт не удался, игрок всё равно должен получить игру
    console.error('go/download', e);
    return deliver();
  }
}
