// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'astro/loaders';
import type { Loader, LoaderContext } from 'astro/loaders';
import { scanGamesDir, GAME_FILE } from './game-folder';

/**
 * Загрузчик игр для Astro: находит все папки в games/ сам — регистрировать игры не нужно.
 *
 * Перед загрузкой каждая папка проверяется. Папка с ошибкой НЕ останавливает сборку:
 * она пропускается, а в выводе сборки появляется заметное сообщение с причиной.
 * Остальные игры публикуются как обычно.
 *
 * В режиме разработки (npm run dev) загрузчик следит за всей папкой games/:
 * добавление, удаление и исправление любой папки подхватываются без перезапуска.
 */
/**
 * Версия формата данных игры. Увеличивайте при добавлении/изменении полей в game-schema.ts —
 * тогда Astro перечитает все папки игр, а не возьмёт старые данные из кэша.
 */
const SCHEMA_VERSION = '7-os-local-download';

export function gamesLoader(options: { base: string }): Loader {
  let watching = false;

  async function loadAll(context: LoaderContext, baseDir: string) {
    if (context.meta.get('schema-version') !== SCHEMA_VERSION) {
      context.store.clear();
      context.meta.set('schema-version', SCHEMA_VERSION);
    }
    const reports = await scanGamesDir(baseDir);

    for (const r of reports) {
      if (!r.ok) {
        context.logger.error(`ИГРА НЕ ДОБАВЛЕНА — папка «${r.folder}»:\n  - ${r.errors.join('\n  - ')}\n  Исправьте index.md (подсказки: npm run game:check)`);
      } else if (r.warnings.length) {
        context.logger.info(`Игра «${r.folder}»: ${r.warnings.join('; ')}`);
      }
    }

    const valid = reports.filter((r) => r.ok);
    const skipped = reports.length - valid.length;
    context.logger.info(`Игр найдено: ${valid.length}${skipped ? ` (не добавлено из-за ошибок: ${skipped})` : ''}`);

    if (valid.length === 0) {
      context.store.clear();
      return;
    }

    // Имена папок могут содержать пробелы, кириллицу и скобки — экранируем для glob
    const escape = (s: string) => s.replace(/[()[\]{}!*?+@]/g, '\\$&');
    const slugByFolder = new Map(valid.map((r) => [r.folder, r.slug]));

    const inner = glob({
      pattern: valid.map((r) => `${escape(r.folder)}/${GAME_FILE}`),
      base: options.base,
      generateId: ({ entry }) => slugByFolder.get(entry.split('/')[0]) ?? entry.split('/')[0],
    });
    // За изменениями следим сами (см. ниже), поэтому встроенному наблюдателю glob его не передаём
    await inner.load({ ...context, watcher: undefined });
  }

  return {
    name: 'kaviku-games',
    load: async (context) => {
      const baseDir = path.resolve(fileURLToPath(context.config.root), options.base);
      await loadAll(context, baseDir);

      const { watcher } = context;
      if (!watcher || watching) return;
      watching = true;
      watcher.add(baseDir);

      let timer: ReturnType<typeof setTimeout> | undefined;
      let running = Promise.resolve();
      watcher.on('all', (_event, file) => {
        if (!path.resolve(file).startsWith(baseDir + path.sep)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          running = running.then(() => loadAll(context, baseDir)).catch((e) => context.logger.error(String(e)));
        }, 300);
      });
    },
  };
}
