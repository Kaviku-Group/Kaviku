// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * GET /api/stats — лайки и скачивания всех игр одним запросом (для каталога).
 * Ответ: { "stats": { "<slug>": { "likes": 3, "downloads": 10 } } }
 */
import type { Ctx } from '../../server/env';
import { error, json } from '../../server/http';

export async function onRequestGet({ env }: Ctx): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT slug, likes, downloads FROM game_stats').all<{
      slug: string;
      likes: number;
      downloads: number;
    }>();
    const stats = Object.fromEntries(results.map((r) => [r.slug, { likes: r.likes, downloads: r.downloads }]));
    return json({ stats });
  } catch (e) {
    console.error('api/stats', e);
    return error(500, 'server_error', 'Не удалось загрузить счётчики');
  }
}
