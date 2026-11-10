// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Недели для «Игры недели»: с понедельника 00:00 до следующего понедельника 00:00.
 * Часовой пояс — Москва (UTC+3, без перехода на летнее время).
 * Чтобы считать по другому поясу, достаточно поменять TZ_OFFSET_HOURS.
 */
export const TZ_OFFSET_HOURS = 3;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

/** Начало текущей недели (понедельник 00:00 по выбранному поясу) в мс UTC. */
export function weekStart(now: number = Date.now()): number {
  const local = now + TZ_OFFSET_HOURS * HOUR; // «местное» время, записанное как UTC
  const day = new Date(local).getUTCDay(); // 0 — воскресенье … 6 — суббота
  const sinceMonday = (day + 6) % 7;
  const midnight = local - (local % DAY);
  return midnight - sinceMonday * DAY - TZ_OFFSET_HOURS * HOUR;
}

export interface Candidate {
  slug: string;
  weeklyLikes: number;
  totalLikes: number;
  totalDownloads: number;
  publishedAt: string;
}

/**
 * Победитель недели: больше лайков за неделю → больше лайков за всё время →
 * больше скачиваний за всё время → более новая игра → по алфавиту (чтобы итог был однозначным).
 */
export function pickWinner(candidates: Candidate[]): Candidate | undefined {
  return [...candidates].sort(
    (a, b) =>
      b.weeklyLikes - a.weeklyLikes ||
      b.totalLikes - a.totalLikes ||
      b.totalDownloads - a.totalDownloads ||
      b.publishedAt.localeCompare(a.publishedAt) ||
      a.slug.localeCompare(b.slug),
  )[0];
}
