// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Настройка «Не показывать игры 18+». Хранится в браузере посетителя (localStorage),
 * действует на каталог, «Игру недели» и страницы авторов.
 * Игры 18+ отмечены атрибутом data-adult у карточек и блока «Игра недели».
 */
const KEY = 'kaviku:hide-adult';
export const HIDE_ADULT_EVENT = 'kaviku:hide-adult';

export function getHideAdult(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setHideAdult(value: boolean): void {
  try {
    if (value) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // нет доступа к хранилищу — настройка действует до перезагрузки страницы
  }
  document.dispatchEvent(new CustomEvent(HIDE_ADULT_EVENT, { detail: value }));
}

/** Возрастная маркировка 18+ и старше. */
export const isAdultRating = (rating: string | undefined): boolean => !!rating && Number.parseInt(rating, 10) >= 18;
