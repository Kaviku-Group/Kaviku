// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

// Шаг после сборки: Cloudflare Pages для адресов /en/... ищет страницу ошибки в файле en/404.html,
// а Astro сохраняет её как en/404/index.html. Копируем, чтобы англоязычная 404 работала.
import { copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const pairs = [['en/404/index.html', 'en/404.html']];

for (const [from, to] of pairs) {
  const src = path.join(dist, from);
  try {
    await access(src);
    await copyFile(src, path.join(dist, to));
    console.log(`postbuild: ${from} → ${to}`);
  } catch {
    console.warn(`postbuild: нет файла ${from} — пропущено`);
  }
}
