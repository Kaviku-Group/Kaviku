// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * GET /api/featured — «Игра недели».
 *
 * Победитель — игра, набравшая больше всех лайков за прошедшую неделю
 * (с понедельника 00:00 до понедельника 00:00 по Москве). Ничья: лайки за всё время,
 * затем скачивания за всё время, затем более новая игра.
 *
 * Победитель выбирается первым запросом после понедельника 00:00 и сохраняется в
 * таблицу weekly_featured — до следующего понедельника он не меняется (даже если
 * кто-то снимет лайк). Ответ: { slug, weeklyLikes, weekStart, nextChange }
 */
import type { Ctx } from '../../server/env';
import { error, json } from '../../server/http';
import { loadManifest } from '../../server/games';
import { pickWinner, weekStart, WEEK, type Candidate } from '../../server/week';

interface Stored {
  slug: string;
  weekly_likes: number;
}

export async function onRequestGet({ request, env }: Ctx): Promise<Response> {
  try {
    const manifest = await loadManifest(request, env);
    const slugs = Object.keys(manifest);
    if (slugs.length === 0) return json({ slug: null });

    const current = weekStart();
    const previous = current - WEEK;
    const respond = (slug: string, weeklyLikes: number) =>
      json({ slug, weeklyLikes, weekStart: current, nextChange: current + WEEK });

    // Уже выбран на эту неделю — отдаём сохранённого (если игра всё ещё на сайте)
    const stored = await env.DB.prepare('SELECT slug, weekly_likes FROM weekly_featured WHERE week_start = ?').bind(current).first<Stored>();
    if (stored && manifest[stored.slug]) return respond(stored.slug, stored.weekly_likes);

    // Считаем победителя прошедшей недели
    const [weekly, totals] = await env.DB.batch([
      env.DB.prepare('SELECT slug, COUNT(*) AS n FROM likes WHERE created_at >= ? AND created_at < ? GROUP BY slug').bind(previous, current),
      env.DB.prepare('SELECT slug, likes, downloads FROM game_stats'),
    ]);
    const weeklyBySlug = new Map((weekly.results as { slug: string; n: number }[]).map((r) => [r.slug, r.n]));
    const totalsBySlug = new Map((totals.results as { slug: string; likes: number; downloads: number }[]).map((r) => [r.slug, r]));

    const candidates: Candidate[] = slugs.map((slug) => ({
      slug,
      weeklyLikes: weeklyBySlug.get(slug) ?? 0,
      totalLikes: totalsBySlug.get(slug)?.likes ?? 0,
      totalDownloads: totalsBySlug.get(slug)?.downloads ?? 0,
      publishedAt: manifest[slug].publishedAt ?? '',
    }));
    const winner = pickWinner(candidates)!;

    if (!stored) {
      // Фиксируем на всю неделю (если два запроса пришли одновременно — сохранится один)
      await env.DB.prepare('INSERT OR IGNORE INTO weekly_featured (week_start, slug, weekly_likes, decided_at) VALUES (?, ?, ?, ?)')
        .bind(current, winner.slug, winner.weeklyLikes, Date.now())
        .run();
      const saved = await env.DB.prepare('SELECT slug, weekly_likes FROM weekly_featured WHERE week_start = ?').bind(current).first<Stored>();
      if (saved && manifest[saved.slug]) return respond(saved.slug, saved.weekly_likes);
    }
    // Сохранённая игра удалена с сайта — показываем лучшую из оставшихся
    return respond(winner.slug, winner.weeklyLikes);
  } catch (e) {
    console.error('api/featured', e);
    return error(500, 'server_error', 'Не удалось определить игру недели');
  }
}
