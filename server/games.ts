// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { Env } from './env';

/**
 * Список игр для функций: собирается при сборке сайта в файл /data/games.json
 * (src/pages/data/games.json.ts) и читается из статических файлов (минуя пароль сайта).
 * Нужен, чтобы принимать лайки только для существующих игр и знать ссылки на скачивание.
 */
export interface GameManifestEntry {
  downloadUrl: string | null;
  publishedAt: string;
}
export type GameManifest = Record<string, GameManifestEntry>;

export async function loadManifest(request: Request, env: Env): Promise<GameManifest> {
  const res = await env.ASSETS.fetch(new URL('/data/games.json', request.url).toString());
  if (!res.ok) throw new Error(`не удалось прочитать /data/games.json (${res.status})`);
  return (await res.json()) as GameManifest;
}

/** Адрес игры из URL: только латиница, цифры и дефисы. */
export const isSlug = (value: string | undefined): value is string => !!value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
