// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { GameSummary, Genre, Tag } from './types';
import { genres as baseGenres, tags as baseTags, platforms as basePlatforms, findTermSlug, splitTerm, termKey } from './taxonomy';
import { slugify } from '../lib/slug';
import { detectLanguages } from '../lib/language';
import { defaultLocale, type Locale } from '../i18n';
import { linkifyCustomLinksInHtml } from '../lib/inline-markdown';

/**
 * Единая точка доступа к данным каталога.
 *
 * Игры читаются из папок games/<папка>/index.md (см. games/README.md).
 * Жанры и теги собираются из самих игр: новое значение автоматически
 * становится фильтром. При подключении D1 меняется только этот файл.
 */

export interface Taxonomy {
  genres: Genre[];
  tags: Tag[];
  /** Платформы (поле os): Windows, Linux, macOS… */
  platforms: Tag[];
}

/** Справочники с быстрым поиском по slug. */
export interface TaxonomyIndex extends Taxonomy {
  genreBySlug: Map<string, Genre>;
  tagBySlug: Map<string, Tag>;
  platformBySlug: Map<string, Tag>;
}

/**
 * Адрес файла игры на сайте: «./mygame.zip» → «/downloads/<игра>/mygame.zip».
 * Сам файл копируется в сборку интеграцией src/integrations/game-files.ts.
 */
export function localDownloadPath(slug: string, relative: string): string {
  const name = relative.replace(/^\.\//, '').split('/').pop()!;
  return `/downloads/${slug}/${encodeURIComponent(name)}`;
}

/**
 * Справочник жанров или тегов по значениям из игр.
 * - Значение из базового списка (в любом написании) → базовый жанр/тег с его кодом и переводом.
 * - Новое значение → новый жанр/тег: написание из первой игры, код из транслитерации («Шутер» → shuter).
 * - «Шутер», «шутер» и « Шутер  » — одно и то же (регистр, пробелы и «ё» не важны).
 * В фильтрах показываются только значения, которые есть хотя бы у одной опубликованной игры:
 * сначала базовые в их порядке, затем новые по алфавиту.
 */
class TermRegistry<T extends Genre | Tag> {
  private byKey = new Map<string, T>();
  private used = new Set<string>();
  private extra: T[] = [];
  /** Варианты написания нового жанра/тега и сколько раз каждый встретился. */
  private spellings = new Map<T, Map<string, number>>();

  constructor(private base: T[]) {
    for (const item of base) this.byKey.set(termKey(item.slug), item);
  }

  /**
   * Возвращает slug для значения из файла игры, создавая новый жанр/тег при необходимости.
   * Значение может содержать перевод: «Киберпанк | Cyberpunk».
   */
  resolve(value: string): string {
    const { primary, translation } = splitTerm(value);
    const baseSlug = findTermSlug(this.base, value);
    let item = baseSlug
      ? this.base.find((b) => b.slug === baseSlug)
      : (this.byKey.get(termKey(primary)) ?? (translation ? this.byKey.get(termKey(translation)) : undefined));
    if (!item) {
      const taken = new Set([...this.base, ...this.extra].map((i) => i.slug));
      const root = slugify(translation ?? primary) || 'term';
      let slug = root;
      for (let n = 2; taken.has(slug); n++) slug = `${root}-${n}`;
      item = { slug, name: { ru: primary } } as T;
      this.extra.push(item);
      this.spellings.set(item, new Map());
    }
    // Новые жанры/теги: запоминаем написание и перевод (если указан через «|»)
    const variants = this.spellings.get(item);
    if (variants) {
      variants.set(primary, (variants.get(primary) ?? 0) + 1);
      this.byKey.set(termKey(primary), item);
      if (translation) {
        this.byKey.set(termKey(translation), item);
        if (!item.name.en) item.name = { ...item.name, en: translation };
      }
    }
    this.used.add(item.slug);
    return item.slug;
  }

  list(): T[] {
    // Название нового жанра/тега: самое частое написание; при равенстве —
    // «С заглавной» лучше «строчными», а «строчными» лучше «КАПСОМ» (короткие RPG/FPS — не капс)
    const style = (s: string) => {
      const shouting = s === s.toUpperCase() && /\p{L}{4,}/u.test(s);
      if (shouting) return 0;
      return s.charAt(0) !== s.charAt(0).toLowerCase() ? 2 : 1;
    };
    for (const [item, variants] of this.spellings) {
      const best = [...variants].sort((a, b) => b[1] - a[1] || style(b[0]) - style(a[0]))[0];
      if (best) item.name = { ...item.name, ru: best[0] };
    }
    const extra = [...this.extra].sort((a, b) => a.name.ru.localeCompare(b.name.ru, 'ru'));
    return [...this.base, ...extra].filter((i) => this.used.has(i.slug));
  }
}

// Адрес игры (entry.id) уже проверен и при необходимости получен из имени папки в src/lib/games-loader.ts
function toSummary(
  entry: CollectionEntry<'games'>,
  genres: TermRegistry<Genre>,
  tags: TermRegistry<Tag>,
  platforms: TermRegistry<Tag>,
): GameSummary {
  const d = entry.data;
  const download = d.downloadUrl?.startsWith('./') ? localDownloadPath(entry.id, d.downloadUrl) : d.downloadUrl;
  return {
    slug: entry.id,
    // Английские версии — из блока en: в index.md; если их нет, на /en показывается русский текст
    title: { ru: d.title, en: d.en?.title },
    shortDescription: { ru: d.shortDescription, en: d.en?.shortDescription },
    author: { slug: slugify(d.author), nickname: d.author },
    studio: d.studio ? { slug: slugify(d.studio), name: d.studio } : undefined,
    genres: [...new Set(d.genres.map((g) => genres.resolve(g)))],
    tags: [...new Set((d.tags ?? []).map((tg) => tags.resolve(tg)))],
    platforms: [...new Set((d.os ?? []).map((p) => platforms.resolve(p)))],
    // Счётчики появятся вместе с базой данных D1
    likes: 0,
    downloads: 0,
    publishedAt: d.publishedAt.toISOString(),
    updatedAt: d.updatedAt?.toISOString(),
    ageRating: d.ageRating,
    // Языки игры: из поля language, а если его нет — по текстам (русский текст → RU, английская версия → EN)
    languages:
      d.language ??
      detectLanguages({
        ruTexts: [d.title, d.shortDescription, (entry.body ?? '').split(/<!--\s*en\s*-->/i)[0]],
        hasEnglishVersion: !!d.en?.shortDescription || /<!--\s*en\s*-->/i.test(entry.body ?? ''),
      }),
    cover: d.cover,
    // «?? []» — на случай данных из кэша Astro, сохранённых до появления этих полей
    screenshots: d.screenshots ?? [],
    videos: d.videoUrl ?? [],
    downloadUrl: download,
    supportUrl: d.supportUrl,
    version: d.version,
    featured: d.featured,
  };
}

interface CatalogData {
  games: GameSummary[];
  taxonomy: TaxonomyIndex;
}

let cache: Promise<CatalogData> | undefined;

/** Игры и справочники считаются один раз за сборку. */
function loadCatalog(): Promise<CatalogData> {
  if (import.meta.env.DEV) cache = undefined; // в режиме разработки — всегда свежие данные
  cache ??= (async () => {
    const entries = await getCollection('games', (e) => !e.data.draft);
    // Стабильный порядок: написание нового жанра/тега берётся из первой по алфавиту папки
    entries.sort((a, b) => a.id.localeCompare(b.id));
    const genres = new TermRegistry(baseGenres);
    const tags = new TermRegistry(baseTags);
    const platforms = new TermRegistry(basePlatforms);
    const games = entries.map((e) => toSummary(e, genres, tags, platforms)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const genreList = genres.list();
    const tagList = tags.list();
    const platformList = platforms.list();
    return {
      games,
      taxonomy: {
        genres: genreList,
        tags: tagList,
        platforms: platformList,
        genreBySlug: new Map(genreList.map((g) => [g.slug, g])),
        tagBySlug: new Map(tagList.map((tg) => [tg.slug, tg])),
        platformBySlug: new Map(platformList.map((p) => [p.slug, p])),
      },
    };
  })();
  return cache;
}

/** Жанры и теги, которые есть у опубликованных игр. */
export async function getTaxonomy(): Promise<TaxonomyIndex> {
  return (await loadCatalog()).taxonomy;
}

/** Все опубликованные игры (без черновиков), сначала новые. */
export async function getPublishedGames(): Promise<GameSummary[]> {
  return (await loadCatalog()).games;
}

export async function getGameBySlug(slug: string): Promise<GameSummary | undefined> {
  return (await getPublishedGames()).find((g) => g.slug === slug);
}

/**
 * Выбирает часть описания на нужном языке.
 * В index.md части отмечаются строками <!-- ru --> и <!-- en -->.
 * Без меток весь текст общий для обоих языков; если нужной части нет — показывается русская.
 */
function pickLanguage(html: string, locale: Locale): string {
  const parts = html.split(/<!--\s*(ru|en)\s*-->/i);
  if (parts.length === 1) return html;
  const sections: Partial<Record<string, string>> = { [defaultLocale]: parts[0] }; // текст до первой метки — русский
  for (let i = 1; i < parts.length; i += 2) {
    const lang = parts[i].toLowerCase();
    sections[lang] = (sections[lang] ?? '') + parts[i + 1];
  }
  const own = sections[locale];
  return own?.trim() ? own : (sections[defaultLocale] ?? '');
}

/**
 * Полное описание игры (текст под второй --- в index.md) в виде HTML на нужном языке.
 * undefined — если описания нет.
 */
export async function getGameDescription(slug: string, locale: Locale = defaultLocale): Promise<string | undefined> {
  const entry = await getEntry('games', slug);
  const html = entry?.rendered?.html;
  if (!entry?.body?.trim() || !html) return undefined;
  const text = linkifyCustomLinksInHtml(pickLanguage(html, locale).trim());
  return text || undefined;
}

/**
 * Запасная «Игра недели» на время сборки сайта. Настоящую выбирает сервер по лайкам
 * за неделю (functions/api/featured.ts). Запасная: игра с featured: true, иначе самая новая.
 */
export async function getFeaturedGame(): Promise<GameSummary | undefined> {
  const games = await getPublishedGames();
  return games.find((g) => g.featured) ?? games[0];
}

/** Авторы с их играми (для страниц /authors/<slug>). */
export async function getAuthors(): Promise<{ slug: string; nickname: string; games: GameSummary[] }[]> {
  const byAuthor = new Map<string, { slug: string; nickname: string; games: GameSummary[] }>();
  for (const game of await getPublishedGames()) {
    const entry = byAuthor.get(game.author.slug) ?? { slug: game.author.slug, nickname: game.author.nickname, games: [] };
    entry.games.push(game);
    byAuthor.set(game.author.slug, entry);
  }
  return [...byAuthor.values()].filter((a) => a.slug);
}

/** Жанры и теги конкретной игры в виде объектов. */
export function resolveGameTaxonomy(game: GameSummary, index: TaxonomyIndex) {
  return {
    genres: game.genres.map((s) => index.genreBySlug.get(s)).filter((g): g is Genre => g !== undefined),
    tags: game.tags.map((s) => index.tagBySlug.get(s)).filter((tg): tg is Tag => tg !== undefined),
    platforms: (game.platforms ?? []).map((s) => index.platformBySlug.get(s)).filter((p): p is Tag => p !== undefined),
  };
}

/** Путь каталога с фильтром (без языкового префикса — его добавляет i18n.href). */
export const catalogFilterPath = {
  genre: (slug: string) => `/?genre=${encodeURIComponent(slug)}#catalog`,
  tag: (slug: string) => `/?tag=${encodeURIComponent(slug)}#catalog`,
  platform: (slug: string) => `/?os=${encodeURIComponent(slug)}#catalog`,
};
