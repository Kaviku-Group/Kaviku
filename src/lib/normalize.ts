// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Нормализация текста для поиска: регистр, «ё» → «е», лишние пробелы.
 * Та же функция будет использоваться на сервере при поиске в D1.
 */
export function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}
