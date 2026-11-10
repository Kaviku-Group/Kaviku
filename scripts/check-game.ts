// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Проверка папки игры ПРИ ПОДГОТОВКЕ — до того, как её скопируют в games/.
 * Проверяет данные, жанры, теги, возрастную маркировку, ссылки и картинки.
 *
 *   npm run game:check -- "C:\путь\к\папке\игры"     ← одна или несколько папок
 *   npm run game:check                                 ← все папки в games/
 *
 * Ссылки дополнительно проверяются запросом (только предупреждение: сайт может
 * не отвечать роботам). Код возврата 1 — есть ошибки.
 */
import path from 'node:path';
import { validateGameFolder, scanGamesDir, splitFrontmatter, GAME_FILE, type GameFolderReport } from '../src/lib/game-folder';
import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);

const reports: GameFolderReport[] = args.length
  ? await Promise.all(args.map((a) => validateGameFolder(path.resolve(a))))
  : await scanGamesDir(path.join(root, 'games'));

async function checkLink(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(10_000) });
    return res.ok ? undefined : `ответ ${res.status}`;
  } catch (e) {
    return (e as Error).name === 'TimeoutError' ? 'нет ответа за 10 секунд' : 'не открывается';
  }
}

let failed = 0;
for (const r of reports) {
  if (r.ok) {
    const raw = await readFile(path.join(r.dir, GAME_FILE), 'utf8');
    const data = parseYaml(splitFrontmatter(raw)!.data) as Record<string, unknown>;
    for (const key of ['downloadUrl', 'supportUrl'] as const) {
      const url = data[key];
      if (typeof url === 'string') {
        const problem = await checkLink(url);
        if (problem) r.warnings.push(`${key}: ссылка ${problem} — проверьте её в браузере`);
      }
    }
  }

  console.log(`\n${r.ok ? '✔' : '✖'} ${r.folder}  →  /games/${r.slug}${r.draft ? '  (черновик: draft: true — на сайте не появится)' : ''}`);
  for (const e of r.errors) console.log(`   ошибка: ${e}`);
  for (const w of r.warnings) console.log(`   совет:  ${w}`);
  if (!r.ok) failed++;
}

if (!reports.length) console.log('Папки игр не найдены.');
console.log(
  failed
    ? `\nОшибок в папках: ${failed}. Такие игры при сборке будут пропущены — исправьте и проверьте снова.`
    : `\nВсё в порядке${reports.length ? ': папку можно копировать в games/' : ''}.`,
);
process.exitCode = failed ? 1 : 0;
