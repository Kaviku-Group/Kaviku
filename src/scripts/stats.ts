// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Настоящие лайки и скачивания из базы D1 (GET /api/stats) — подставляются во все
 * блоки [data-stats-slug] на странице и в данные карточек каталога (для сортировки).
 * Если API недоступен (например, при `npm run dev`), остаются числа из сборки.
 */
import { pageI18n } from '../i18n';

export interface GameCounts {
  likes: number;
  downloads: number;
}
export type StatsMap = Record<string, GameCounts>;

/** Событие после обновления чисел: каталог пересортировывает карточки. */
export const STATS_EVENT = 'kaviku:stats';

let request: Promise<StatsMap | null> | undefined;
/** Последние известные числа по играм. */
const current: StatsMap = {};

export function getCounts(slug: string): GameCounts {
  return current[slug] ?? { likes: 0, downloads: 0 };
}

export function loadStats(): Promise<StatsMap | null> {
  request ??= fetch('/api/stats', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    .then((r) => (r.ok && (r.headers.get('Content-Type') ?? '').includes('json') ? r.json() : null))
    .then((data) => (data && typeof data.stats === 'object' ? (data.stats as StatsMap) : null))
    .catch(() => null);
  return request;
}

/** Подставляет числа на страницу. partial — обновить только указанные игры. */
export function applyStats(stats: StatsMap, partial = false): void {
  const { t, formatCount } = pageI18n();
  Object.assign(current, stats);
  document.querySelectorAll<HTMLElement>('[data-stats-slug]').forEach((block) => {
    const slug = block.dataset.statsSlug!;
    if (partial && !(slug in stats)) return;
    const counts = stats[slug] ?? { likes: 0, downloads: 0 };
    for (const key of ['likes', 'downloads'] as const) {
      const n = counts[key];
      const dd = block.querySelector<HTMLElement>(`[data-stat="${key}"]`);
      if (dd) dd.textContent = formatCount(n);
      const wrap = block.querySelector<HTMLElement>(`[data-stat-wrap="${key}"]`);
      if (wrap) wrap.title = `${formatCount(n)} ${t(key === 'likes' ? 'stats.likes' : 'stats.downloads', { n })}`;
    }
    // Карточка каталога хранит числа в data-атрибутах — для сортировки «по лайкам/скачиваниям»
    const card = block.closest<HTMLElement>('[data-game]');
    if (card) {
      card.dataset.likes = String(counts.likes);
      card.dataset.downloads = String(counts.downloads);
    }
  });
  document.dispatchEvent(new CustomEvent(STATS_EVENT));
}

/** Повторно подставить уже известные числа (например, в только что вставленный блок). */
export function reapplyStats(): void {
  if (Object.keys(current).length) applyStats({ ...current }, true);
}

/** Заново запросить счётчики у сервера (после скачивания, при возврате на вкладку). */
export async function refreshStats(): Promise<void> {
  request = undefined;
  const stats = await loadStats();
  if (stats) applyStats(stats);
}

/** Загрузить и показать счётчики (вызывается на каждой странице). */
export async function initStats(): Promise<void> {
  const stats = await loadStats();
  if (stats) applyStats(stats);

  // Скачивание открывается в новой вкладке, а засчитывается на сервере —
  // обновляем числа через пару секунд после нажатия и когда посетитель возвращается на вкладку.
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-download-link]')) {
      setTimeout(refreshStats, 1500);
      setTimeout(refreshStats, 5000);
    }
  });
  let last = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - last > 3000) {
      last = Date.now();
      refreshStats();
    }
  });
}
