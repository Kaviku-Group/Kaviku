// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Служебный файл /data/games.json: адреса игр и ссылки на скачивание.
 * Создаётся при сборке; его читают серверные функции (лайки и /go/download/…).
 */
import { getPublishedGames } from '../../data/catalog';

export async function GET() {
  const games = await getPublishedGames();
  const manifest = Object.fromEntries(games.map((g) => [g.slug, { downloadUrl: g.downloadUrl ?? null, publishedAt: g.publishedAt }]));
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
