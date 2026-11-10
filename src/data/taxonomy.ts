// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { Genre, Tag } from './types';
import { normalizeSearch } from '../lib/normalize';

/**
 * Базовые жанры и теги: постоянные коды (slug), порядок показа и переводы RU / EN.
 * Это НЕ ограничение: жанр или тег, которого здесь нет, просто появляется в каталоге
 * автоматически (см. src/data/catalog.ts). Базовый список нужен, чтобы:
 *  - «pixel art», «Pixel-Art» и «Pixel Art» считались одним тегом;
 *  - «Шутер» и «Shooter» были одним жанром, а на английской версии показывался перевод.
 * В фильтрах показываются только жанры и теги, которые есть у опубликованных игр.
 *
 * Чтобы перевести новый жанр/тег без правки кода, в index.md можно написать «Русское | English».
 */
export const genres: Genre[] = [
  { slug: 'action', name: { ru: 'Экшен', en: 'Action' } },
  { slug: 'adventure', name: { ru: 'Приключение', en: 'Adventure' } },
  { slug: 'shooter', name: { ru: 'Шутер', en: 'Shooter' } },
  { slug: 'horror', name: { ru: 'Хоррор', en: 'Horror' } },
  { slug: 'puzzle', name: { ru: 'Головоломка', en: 'Puzzle' } },
  { slug: 'platformer', name: { ru: 'Платформер', en: 'Platformer' } },
  { slug: 'simulation', name: { ru: 'Симулятор', en: 'Simulation' } },
  { slug: 'rpg', name: { ru: 'RPG', en: 'RPG' } },
  { slug: 'strategy', name: { ru: 'Стратегия', en: 'Strategy' } },
  { slug: 'arcade', name: { ru: 'Аркада', en: 'Arcade' } },
  { slug: 'racing', name: { ru: 'Гонки', en: 'Racing' } },
  { slug: 'fighting', name: { ru: 'Файтинг', en: 'Fighting' } },
  { slug: 'roguelike', name: { ru: 'Рогалик', en: 'Roguelike' } },
  { slug: 'metroidvania', name: { ru: 'Метроидвания', en: 'Metroidvania' } },
  { slug: 'visual-novel', name: { ru: 'Визуальная новелла', en: 'Visual novel' } },
  { slug: 'sandbox', name: { ru: 'Песочница', en: 'Sandbox' } },
  { slug: 'sports', name: { ru: 'Спорт', en: 'Sports' } },
  { slug: 'rhythm', name: { ru: 'Ритм-игра', en: 'Rhythm' } },
  { slug: 'stealth', name: { ru: 'Стелс', en: 'Stealth' } },
  { slug: 'tower-defense', name: { ru: 'Tower Defense', en: 'Tower Defense' } },
  { slug: 'card', name: { ru: 'Карточная', en: 'Card game' } },
  { slug: 'casual', name: { ru: 'Казуальная', en: 'Casual' } },
  { slug: 'educational', name: { ru: 'Обучающая', en: 'Educational' } },
  { slug: 'other', name: { ru: 'Другое', en: 'Other' } },
  { slug: 'multiplayer', name: { ru: 'Мультиплеер', en: 'Multiplayer' } },
];

export const tags: Tag[] = [
  { slug: '2d', name: { ru: '2D', en: '2D' }, aliases: ['2Д'] },
  { slug: '3d', name: { ru: '3D', en: '3D' }, aliases: ['3Д'] },
  { slug: 'pixel-art', name: { ru: 'Pixel Art', en: 'Pixel Art' } },
  { slug: 'low-poly', name: { ru: 'Low Poly', en: 'Low Poly' } },
  { slug: 'multiplayer', name: { ru: 'Мультиплеер', en: 'Multiplayer' } },
  { slug: 'singleplayer', name: { ru: 'Одиночная игра', en: 'Singleplayer' } },
  { slug: 'coop', name: { ru: 'Кооператив', en: 'Co-op' } },
  { slug: 'pvp', name: { ru: 'PvP', en: 'PvP' } },
  { slug: 'online', name: { ru: 'Онлайн', en: 'Online' } },
  { slug: 'open-world', name: { ru: 'Открытый мир', en: 'Open world' } },
  { slug: 'shooter', name: { ru: 'Шутер', en: 'Shooter' } },
  { slug: 'shooting', name: { ru: 'Стрелялка', en: 'Shooting' } },
  { slug: 'first-person', name: { ru: 'От первого лица', en: 'First-person' } },
  { slug: 'third-person', name: { ru: 'От третьего лица', en: 'Third-person' } },
  { slug: 'top-down', name: { ru: 'Вид сверху', en: 'Top-down' } },
  { slug: 'retro', name: { ru: 'Ретро', en: 'Retro' } },
  { slug: 'survival', name: { ru: 'Выживание', en: 'Survival' } },
  { slug: 'story-rich', name: { ru: 'Сюжетная', en: 'Story rich' } },
  { slug: 'short', name: { ru: 'Короткая игра', en: 'Short' } },
  { slug: 'hard', name: { ru: 'Сложная', en: 'Difficult' } },
  { slug: 'relaxing', name: { ru: 'Расслабляющая', en: 'Relaxing' } },
  { slug: 'atmospheric', name: { ru: 'Атмосферная', en: 'Atmospheric' } },
  { slug: 'funny', name: { ru: 'Юмор', en: 'Funny' } },
  { slug: 'cute', name: { ru: 'Милая', en: 'Cute' } },
  { slug: 'dark', name: { ru: 'Мрачная', en: 'Dark' } },
  { slug: 'fantasy', name: { ru: 'Фэнтези', en: 'Fantasy' } },
  { slug: 'sci-fi', name: { ru: 'Научная фантастика', en: 'Sci-fi' } },
  { slug: 'cyberpunk', name: { ru: 'Киберпанк', en: 'Cyberpunk' } },
  { slug: 'post-apocalyptic', name: { ru: 'Постапокалипсис', en: 'Post-apocalyptic' } },
  { slug: 'space', name: { ru: 'Космос', en: 'Space' } },
  { slug: 'zombies', name: { ru: 'Зомби', en: 'Zombies' } },
  { slug: 'anime', name: { ru: 'Аниме', en: 'Anime' } },
  { slug: 'physics', name: { ru: 'Физика', en: 'Physics' } },
  { slug: 'crafting', name: { ru: 'Крафт', en: 'Crafting' } },
  { slug: 'building', name: { ru: 'Строительство', en: 'Building' } },
  { slug: 'bots', name: { ru: 'Боты', en: 'Bots' } },
  { slug: 'browser', name: { ru: 'Браузерная', en: 'Browser' } },
  { slug: 'mobile', name: { ru: 'Мобильная', en: 'Mobile' } },
  { slug: 'free', name: { ru: 'Бесплатная', en: 'Free' } },
  { slug: 'early-access', name: { ru: 'Early Access', en: 'Early Access' } },
  { slug: 'procedural', name: { ru: 'Процедурная генерация', en: 'Procedural generation' } },
];

/**
 * Базовые платформы (поле os в index.md). Как и с жанрами, незнакомая платформа
 * создаётся сама; aliases — другие написания той же платформы.
 */
export const platforms: Tag[] = [
  { slug: 'windows', name: { ru: 'Windows', en: 'Windows' }, aliases: ['Win', 'Windows 10', 'Windows 11', 'Виндовс', 'PC', 'ПК'] },
  { slug: 'linux', name: { ru: 'Linux', en: 'Linux' }, aliases: ['Линукс', 'Ubuntu'] },
  { slug: 'macos', name: { ru: 'macOS', en: 'macOS' }, aliases: ['Mac', 'OS X', 'OSX', 'Мак', 'MacOS X'] },
  { slug: 'android', name: { ru: 'Android', en: 'Android' }, aliases: ['Андроид'] },
  { slug: 'ios', name: { ru: 'iOS', en: 'iOS' }, aliases: ['iPhone', 'iPad', 'Айфон'] },
  { slug: 'web', name: { ru: 'Браузер', en: 'Browser' }, aliases: ['Web', 'HTML5', 'Веб', 'Online', 'Онлайн'] },
  { slug: 'steam-deck', name: { ru: 'Steam Deck', en: 'Steam Deck' } },
];

/**
 * Возрастная маркировка — отдельно от жанров и тегов (не участвует в фильтрах).
 * Как и с жанрами, значение может быть любым возрастом вида «N+» (10+, 13+…) — плашка
 * появится сама. Это список привычных значений (российская система), остальные тоже принимаются.
 */
export const ageRatings = ['0+', '6+', '12+', '16+', '18+'] as const;
export type AgeRating = string;

/** «10», «10+», «10 +», 10 → «10+». Неверный формат или возраст больше 21 — undefined. */
export function normalizeAgeRating(value: string | number): AgeRating | undefined {
  const m = String(value).trim().match(/^(\d{1,2})\s*\+?$/);
  if (!m) return undefined;
  const age = Number(m[1]);
  return age <= 21 ? `${age}+` : undefined;
}

/** Ключ сравнения: регистр, «ё», пробелы и дефисы не важны («Pixel art» = «pixel-art»). */
export const termKey = (text: string) => normalizeSearch(text).replace(/[\s_-]+/g, '');

/** «Киберпанк | Cyberpunk» → { primary: 'Киберпанк', translation: 'Cyberpunk' }. */
export function splitTerm(value: string): { primary: string; translation?: string } {
  const [primary, translation] = value.split('|').map((p) => p.trim());
  return { primary, translation: translation || undefined };
}

/**
 * Находит жанр или тег по коду или названию на любом языке
 * (для «Русское | English» проверяются обе части).
 * Возвращает slug или undefined, если такого нет.
 */
export function findTermSlug(list: Array<Genre | Tag>, value: string): string | undefined {
  const { primary, translation } = splitTerm(value);
  const match = (text: string) => {
    const key = termKey(text);
    return list.find(
      (item) =>
        termKey(item.slug) === key ||
        Object.values(item.name).some((n) => n && termKey(n) === key) ||
        (item.aliases ?? []).some((a) => termKey(a) === key),
    )?.slug;
  };
  return match(primary) ?? (translation ? match(translation) : undefined);
}
