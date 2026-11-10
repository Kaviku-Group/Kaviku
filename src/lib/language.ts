// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Языки игры (плашка «RU / EN» в левом верхнем углу обложки).
 * Поле language в index.md: «RU», «EN», «Русский», «English», «РУ», «ЕН» или список.
 * Как и с жанрами, незнакомый язык не ошибка: плашка появится с тем написанием, что указано.
 * Если поля нет — язык определяется по текстам игры.
 */

/** Известные названия языков → короткий код для плашки. */
const ALIASES: Record<string, string> = {
  ru: 'RU', rus: 'RU', ру: 'RU', рус: 'RU', русский: 'RU', russian: 'RU',
  en: 'EN', eng: 'EN', ен: 'EN', англ: 'EN', английский: 'EN', english: 'EN',
  uk: 'UK', ua: 'UK', укр: 'UK', украинский: 'UK', ukrainian: 'UK',
  be: 'BE', бел: 'BE', белорусский: 'BE', belarusian: 'BE',
  kk: 'KK', каз: 'KK', казахский: 'KK', kazakh: 'KK',
  de: 'DE', нем: 'DE', немецкий: 'DE', german: 'DE', deutsch: 'DE',
  fr: 'FR', фр: 'FR', французский: 'FR', french: 'FR', français: 'FR',
  es: 'ES', исп: 'ES', испанский: 'ES', spanish: 'ES', español: 'ES',
  it: 'IT', итальянский: 'IT', italian: 'IT', italiano: 'IT',
  pt: 'PT', португальский: 'PT', portuguese: 'PT', português: 'PT',
  pl: 'PL', польский: 'PL', polish: 'PL', polski: 'PL',
  tr: 'TR', турецкий: 'TR', turkish: 'TR', türkçe: 'TR',
  ja: 'JA', jp: 'JA', японский: 'JA', japanese: 'JA', 日本語: 'JA',
  zh: 'ZH', cn: 'ZH', китайский: 'ZH', chinese: 'ZH', 中文: 'ZH',
  ko: 'KO', kr: 'KO', корейский: 'KO', korean: 'KO', 한국어: 'KO',
};
const KNOWN_CODES = new Set(Object.values(ALIASES));

/**
 * «Русский» → RU, «english» → EN, «de» → DE; незнакомое название остаётся как написано
 * («Эсперанто», «Klingon»). Пусто, слишком длинно или странные символы — undefined.
 */
export function normalizeLanguage(value: string): string | undefined {
  const clean = value.replace(/\s+/g, ' ').trim();
  const key = clean.toLowerCase().replace(/ё/g, 'е');
  if (ALIASES[key]) return ALIASES[key];
  if (/^[a-z]{2,3}$/i.test(clean)) return clean.toUpperCase(); // любой код из 2–3 букв: SV, NL, FIL…
  if (clean.length >= 2 && clean.length <= 20 && /^[\p{L}][\p{L} '-]*$/u.test(clean)) return clean;
  return undefined;
}

/** Язык из известного списка (для подсказок при проверке папки). */
export function isKnownLanguage(code: string): boolean {
  return KNOWN_CODES.has(code);
}

const CYRILLIC = /[а-яё]/i;
const LATIN_WORD = /[a-z]{3,}/i;

/**
 * Определение языков по текстам игры:
 * - русский текст (кириллица) в названии/описании → RU;
 * - есть английская версия (блок en: или часть <!-- en -->) или тексты только латиницей → EN.
 */
export function detectLanguages(input: { ruTexts: string[]; hasEnglishVersion: boolean }): string[] {
  const ru = input.ruTexts.join(' ');
  const langs: string[] = [];
  const hasRussian = CYRILLIC.test(ru);
  if (hasRussian) langs.push('RU');
  if (input.hasEnglishVersion || (!hasRussian && LATIN_WORD.test(ru))) langs.push('EN');
  return langs;
}
