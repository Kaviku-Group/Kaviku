// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { D1Database, Fetcher } from '@cloudflare/workers-types';

/** Привязки и секреты Cloudflare Pages для функций Kaviku. */
export interface Env {
  /** База D1 (wrangler.toml → d1_databases, binding = "DB"). */
  DB: D1Database;
  /** Статические файлы сайта (dist) — отсюда берётся список игр. */
  ASSETS: Fetcher;
  /** Секрет для подписи cookie посетителя и хэша IP. Задаётся: wrangler pages secret put VISITOR_SECRET */
  VISITOR_SECRET?: string;
  /** Пароль закрытого режима (см. functions/_middleware.ts). */
  SITE_PASSWORD?: string;
  SITE_GATE?: string;
}

/** Контекст функции Pages (минимально нужное). */
export interface Ctx<P extends string = never> {
  request: Request;
  env: Env;
  params: Record<P, string>;
}
