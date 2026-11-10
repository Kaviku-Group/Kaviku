// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { D1Database } from '@cloudflare/workers-types';

/**
 * Ограничение частоты действий (фиксированное окно), хранится в D1.
 * Возвращает true, если действие разрешено.
 * Это не абсолютная защита от накрутки, а заметное её затруднение.
 */
export async function allow(db: D1Database, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
         window_start = excluded.window_start
       RETURNING count`,
    )
    .bind(key, windowStart)
    .first<{ count: number }>();

  // Изредка чистим устаревшие записи, чтобы таблица не росла
  if (Math.random() < 0.01) {
    await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - 2 * 86400).run();
  }
  return (row?.count ?? 1) <= limit;
}

/** Текущая дата UTC: «2026-11-05». */
export const today = () => new Date().toISOString().slice(0, 10);
