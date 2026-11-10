// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { copyFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { scanGamesDir, storedDownloadName, type GameFolderReport } from '../lib/game-folder';

/**
 * Файлы игр, лежащие прямо в папке игры (downloadUrl: ./mygame.zip).
 *
 * - При сборке (npm run build / npm run deploy) файлы проверенных и опубликованных игр
 *   копируются в dist/downloads/<игра>/<файл>.dl. Окончание «.dl» не даёт Cloudflare
 *   открыть файл (например, HTML-игру) как страницу сайта.
 * - Кнопка «Скачать игру» ведёт на /go/download/<игра>: функция засчитывает скачивание
 *   и сама отдаёт файл как скачиваемый, с исходным именем (mygame.html, mygame.exe…).
 * - В режиме npm run dev адрес /downloads/<игра>/<файл> отдаётся прямо из папок games/.
 *
 * Проверки (файл внутри папки, разрешённый формат, не больше 25 МБ) — в src/lib/game-folder.ts.
 */
export function gameFiles(options: { gamesDir: string }): AstroIntegration {
  let root = '';
  const published = async (): Promise<GameFolderReport[]> =>
    (await scanGamesDir(path.resolve(root, options.gamesDir))).filter((r) => r.ok && !r.draft && r.localDownload);

  return {
    name: 'kaviku-game-files',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },

      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        for (const r of await published()) {
          const target = path.join(out, 'downloads', r.slug, storedDownloadName(r.localDownload!.name));
          await mkdir(path.dirname(target), { recursive: true });
          await copyFile(r.localDownload!.file, target);
          logger.info(`файл игры «${r.folder}»: /downloads/${r.slug}/${r.localDownload!.name} (${(r.localDownload!.bytes / 1024 / 1024).toFixed(1)} МБ)`);
        }
      },

      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const m = req.url?.match(/^\/downloads\/([^/?#]+)\/([^/?#]+)/);
          if (!m) return next();
          const [slug, name] = [decodeURIComponent(m[1]), decodeURIComponent(m[2])];
          const game = (await published()).find((r) => r.slug === slug && r.localDownload!.name === name);
          if (!game) return next();
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
          res.setHeader('Content-Length', String(game.localDownload!.bytes));
          createReadStream(game.localDownload!.file).pipe(res);
        });
      },
    },
  };
}
