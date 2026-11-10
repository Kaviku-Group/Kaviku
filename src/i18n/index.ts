// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { ru } from './ru';
import { en } from './en';

/**
 * Локализация без внешних зависимостей.
 * Русский — основной язык (адреса без префикса: /games/x),
 * английский — с префиксом /en (/en/games/x).
 */
export const locales = { ru, en } as const;
export type Locale = keyof typeof locales;
export const defaultLocale: Locale = 'ru';
export const localeList = Object.keys(locales) as Locale[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && value in locales;
}

/** Текст, который хранится в данных (жанры, теги) на нескольких языках. */
export type LocalizedText = { ru: string } & Partial<Record<string, string>>;

type Dict = typeof ru;
type Leaf = string | readonly string[];
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Leaf ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Paths<Dict>;

function lookup(locale: Locale, key: string): Leaf {
  const find = (dict: unknown) => key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dict);
  const value = find(locales[locale]) ?? find(locales[defaultLocale]);
  if (value === undefined) throw new Error(`i18n: нет ключа "${key}" для "${locale}"`);
  return value as Leaf;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}

const pluralRulesCache = new Map<Locale, Intl.PluralRules>();
function pluralIndex(locale: Locale, n: number): 0 | 1 | 2 {
  let rules = pluralRulesCache.get(locale);
  if (!rules) pluralRulesCache.set(locale, (rules = new Intl.PluralRules(locale)));
  const cat = rules.select(n);
  return cat === 'one' ? 0 : cat === 'few' ? 1 : cat === 'two' ? 1 : 2;
}

/** Адрес страницы на нужном языке: localizePath('en', '/games/x') → '/en/games/x'. */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean}`;
}

/** Язык и «чистый» путь из адреса: '/en/games/x' → { locale: 'en', path: '/games/x' }. */
export function splitLocalePath(pathname: string): { locale: Locale; path: string } {
  const m = pathname.match(/^\/([a-z]{2})(\/.*|$)/);
  if (m && isLocale(m[1]) && m[1] !== defaultLocale) return { locale: m[1], path: m[2] || '/' };
  return { locale: defaultLocale, path: pathname || '/' };
}

export function createT(locale: Locale = defaultLocale) {
  /** Обычный текст. Для плюральных ключей передайте params.n. */
  function t(key: TKey, params?: Record<string, string | number>): string {
    const value = lookup(locale, key);
    if (typeof value === 'string') return interpolate(value, params);
    const n = Number(params?.n ?? 0);
    return interpolate(value[pluralIndex(locale, n)], params);
  }

  /** Локализованное поле из данных: нужный язык или русский по умолчанию. */
  function loc(text: LocalizedText): string {
    return text[locale] ?? text.ru;
  }

  /** «1,2 тыс.» / «1.2K» — компактная запись чисел для счётчиков. */
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(locale);
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    locale,
    t,
    loc,
    /** Ссылка внутри сайта на текущем языке. */
    href: (path: string) => localizePath(locale, path),
    formatCount: (n: number) => (n < 10_000 ? full.format(n) : compact.format(n)),
    formatFull: (n: number) => full.format(n),
    formatDate: (iso: string) => dateFmt.format(new Date(iso)),
  };
}

export type I18n = ReturnType<typeof createT>;

/** Локализация для текущей страницы (язык берётся из адреса). */
export function useI18n(astro: { currentLocale?: string; url: URL }): I18n {
  const locale = isLocale(astro.currentLocale) ? astro.currentLocale : splitLocalePath(astro.url.pathname).locale;
  return createT(locale);
}

/** Локализация в браузерных скриптах: язык страницы из <html lang>. */
export function pageI18n(): I18n {
  const lang = document.documentElement.lang;
  return createT(isLocale(lang) ? lang : defaultLocale);
}
