// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { defineCollection } from 'astro:content';
import { createGameSchema } from './data/game-schema';
import { gamesLoader } from './lib/games-loader';

/**
 * Коллекция игр: каждая папка в games/ — одна игра (games/<папка>/index.md + картинки).
 * Папки, начинающиеся с «_» (например, _template), пропускаются.
 * Папка с ошибками не ломает сборку — она пропускается с предупреждением.
 */
const games = defineCollection({
  loader: gamesLoader({ base: './games' }),
  schema: ({ image }) => createGameSchema(image),
});

export const collections = { games };
