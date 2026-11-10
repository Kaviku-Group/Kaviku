// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Главные настройки сайта. Внешние ссылки меняются ТОЛЬКО здесь.
 *
 * Пока ссылка пустая (''), соответствующая кнопка показывается в состоянии
 * «скоро» и никуда не ведёт. Чтобы включить кнопку — вставьте ссылку в кавычки.
 */
export const siteConfig = {
  name: 'Kaviku',
  studioName: 'Kaviku Studio',

  /** Google Форма для кнопки «Предложить игру» (в подвале сайта). */
  submitGameFormUrl: 'https://forms.gle/xmMGfn3gq9RUowQ38',

  /** Адрес сайта. */
  siteUrl: 'https://kaviku.pages.dev',

  /** Исходный код на GitHub (ссылка «Открытый исходный код» в подвале). Лицензия — AGPL-3.0. */
  githubUrl: 'https://github.com/Kaviku-Group/Kaviku?tab=readme-ov-file',

  /** Почта для рекламы и поддержки (строка внизу сайта). */
  contactEmail: 'kaviku_games@proton.me',

  /** Ссылка для кнопки «Поддержать сайт» (в шапке и меню). */
  supportSiteUrl: '',

  /**
   * Маскот Kaviku для пустых состояний и страницы 404.
   * Файл лежит в public/assets/mascot/. Чтобы заменить — положите новый файл туда
   * и укажите его путь здесь ('' — убрать маскота). Лучше WebP/PNG 3:2, от 720×480;
   * с прозрачным фоном — идеально, но и тёмный фон подходит (края растворяются).
   */
  mascotImage: '/assets/mascot/kaviku-mascot-search.webp',

  /** Маскот для страницы «404 — страница не найдена» ('' — использовать mascotImage). */
  notFoundImage: '/assets/mascot/kaviku-mascot-404.webp',

  /** Сколько карточек показывать в каталоге до нажатия «Показать ещё». */
  catalogPageSize: 8,
} as const;

/** Внешняя ссылка задана и выглядит как https-адрес. */
export function isUsableUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}
