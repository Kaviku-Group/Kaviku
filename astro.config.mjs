// @ts-check
// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { defineConfig } from 'astro/config';
import { gameFiles } from './src/integrations/game-files.ts';

// Статическая сборка для Cloudflare Pages (папка dist).
// Серверные функции (лайки, скачивания, игра недели) — в папке functions/.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
  // Языки: русский — основной (без префикса), английский — /en/...
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // Файлы игр из папок games/ (downloadUrl: ./mygame.zip) → /downloads/<игра>/<файл>
  integrations: [gameFiles({ gamesDir: './games' })],
});
