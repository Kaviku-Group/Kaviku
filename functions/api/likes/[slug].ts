// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Лайки игры.
 *   GET  /api/likes/<slug>               → { liked, likes }  (поставил ли лайк этот посетитель)
 *   POST /api/likes/<slug>  {"liked":true|false} → { liked, likes }
 *
 * POST задаёт желаемое состояние (а не «переключает»), поэтому повтор запроса ничего не накручивает.
 * Один лайк на посетителя гарантирует первичный ключ (slug, visitor_id) в таблице likes,
 * а итоговый счётчик пересчитывается из таблицы likes в той же транзакции.
 */
import type { Ctx } from '../../../server/env';
import { error, isSameOrigin, json } from '../../../server/http';
import { getOrCreateVisitor, ipHash, readVisitor } from '../../../server/visitor';
import { allow, today } from '../../../server/rate-limit';
import { isSlug, loadManifest } from '../../../server/games';

async function likesCount(env: Ctx['env'], slug: string): Promise<number> {
  const row = await env.DB.prepare('SELECT likes FROM game_stats WHERE slug = ?').bind(slug).first<{ likes: number }>();
  return row?.likes ?? 0;
}

export async function onRequestGet({ request, env, params }: Ctx<'slug'>): Promise<Response> {
  const slug = params.slug;
  if (!isSlug(slug)) return error(404, 'not_found', 'Игра не найдена');
  try {
    const visitor = await readVisitor(request, env);
    const liked = visitor
      ? !!(await env.DB.prepare('SELECT 1 FROM likes WHERE slug = ? AND visitor_id = ?').bind(slug, visitor.id).first())
      : false;
    return json({ liked, likes: await likesCount(env, slug) });
  } catch (e) {
    console.error('api/likes GET', e);
    return error(500, 'server_error', 'Не удалось загрузить лайки');
  }
}

export async function onRequestPost({ request, env, params }: Ctx<'slug'>): Promise<Response> {
  const slug = params.slug;
  if (!isSameOrigin(request)) return error(403, 'forbidden', 'Запрос с чужого сайта');
  if (!isSlug(slug)) return error(404, 'not_found', 'Игра не найдена');

  let wanted: boolean;
  try {
    const body = (await request.json()) as { liked?: unknown };
    if (typeof body.liked !== 'boolean') throw new Error();
    wanted = body.liked;
  } catch {
    return error(400, 'bad_request', 'Ожидается {"liked": true | false}');
  }

  try {
    const manifest = await loadManifest(request, env);
    if (!manifest[slug]) return error(404, 'not_found', 'Игра не найдена');

    const visitor = await getOrCreateVisitor(request, env);
    const ip = await ipHash(request, env);

    // Ограничения: посетитель — 30 действий в минуту; одна сеть (IP) — 120 в час
    // и не больше 20 лайков одной игре в сутки (сдерживает накрутку через очистку cookie)
    const okVisitor = await allow(env.DB, `like:v:${visitor.id}`, 30, 60);
    const okIp = await allow(env.DB, `like:ip:${ip}`, 120, 3600);
    const okIpGame = wanted ? await allow(env.DB, `like:ipgame:${ip}:${slug}:${today()}`, 20, 86400) : true;
    if (!okVisitor || !okIp || !okIpGame) {
      const res = error(429, 'too_many', 'Слишком много действий. Попробуйте позже.');
      if (visitor.setCookie) res.headers.append('Set-Cookie', visitor.setCookie);
      return res;
    }

    const change = wanted
      ? env.DB.prepare('INSERT OR IGNORE INTO likes (slug, visitor_id, created_at) VALUES (?, ?, ?)').bind(slug, visitor.id, Date.now())
      : env.DB.prepare('DELETE FROM likes WHERE slug = ? AND visitor_id = ?').bind(slug, visitor.id);
    const recount = env.DB.prepare(
      `INSERT INTO game_stats (slug, likes) VALUES (?1, (SELECT COUNT(*) FROM likes WHERE slug = ?1))
       ON CONFLICT(slug) DO UPDATE SET likes = (SELECT COUNT(*) FROM likes WHERE slug = ?1)`,
    ).bind(slug);
    await env.DB.batch([change, recount]); // одна транзакция

    const res = json({ liked: wanted, likes: await likesCount(env, slug) });
    if (visitor.setCookie) res.headers.append('Set-Cookie', visitor.setCookie);
    return res;
  } catch (e) {
    console.error('api/likes POST', e);
    return error(500, 'server_error', 'Не удалось сохранить лайк');
  }
}
