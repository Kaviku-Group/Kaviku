// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = path.join(root, 'games');
const statePath = path.join(gamesDir, '.published-games.json');
const entries = await readdir(gamesDir, { withFileTypes: true });
const gameFolders = [];
for (const entry of entries) {
  if (!entry.isDirectory() || /^[_.]/.test(entry.name)) continue;
  const indexPath = path.join(gamesDir, entry.name, 'index.md');
  try {
    await access(indexPath);
    gameFolders.push({ name: entry.name, indexPath });
  } catch {
    // A folder without index.md is not a game yet.
  }
}

let knownFolders;
try {
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  if (state.version !== 1 || !Array.isArray(state.knownFolders)) throw new Error('unknown state format');
  knownFolders = new Set(state.knownFolders);
} catch (error) {
  if (error.code !== 'ENOENT') throw new Error(`Cannot read ${statePath}: ${error.message}`);
  // First run creates a baseline so existing games keep their current dates.
  knownFolders = new Set();
  for (const game of gameFolders) {
    const raw = (await readFile(game.indexPath, 'utf8')).replace(/^﻿/, '');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!fm) continue;
    let data;
    try {
      data = parse(fm[1]) ?? {};
    } catch {
      continue; // ошибка в записи данных — такую папку проверит и пропустит сборка
    }
    if (data.draft !== true) knownFolders.add(game.name);
  }
  await writeState(knownFolders);
  console.log(`Published game baseline created (${knownFolders.size} existing games).`);
  process.exit(0);
}

const currentNames = new Set(gameFolders.map((game) => game.name));
const nextKnown = new Set([...knownFolders].filter((name) => currentNames.has(name)));
const now = new Date().toISOString();
let stamped = 0;

for (const game of gameFolders) {
  const isNew = !knownFolders.has(game.name);
  // Сломанная папка не должна останавливать публикацию всего сайта: пропускаем с предупреждением
  // (сборка сама покажет причину в строке «ИГРА НЕ ДОБАВЛЕНА»). Дата будет проставлена, когда папку исправят.
  const raw = (await readFile(game.indexPath, 'utf8')).replace(/^﻿/, '');
  const fm = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---[ \t]*(?:\r?\n|$))/);
  if (!fm) {
    console.warn(`stamp-new-games: ${game.name}/index.md — нет блока данных между линиями ---, дата не проставлена`);
    if (knownFolders.has(game.name)) nextKnown.add(game.name);
    continue;
  }
  let data;
  try {
    data = parse(fm[2]) ?? {};
  } catch (error) {
    console.warn(`stamp-new-games: ${game.name}/index.md — ошибка в записи данных (${String(error.message).split('\n')[0]}), дата не проставлена`);
    if (knownFolders.has(game.name)) nextKnown.add(game.name);
    continue;
  }
  if (data.draft === true) continue;
  if (!isNew && data.publishedAt) continue;

  const newline = raw.includes('\r\n') ? '\r\n' : '\n';
  const dateLine = `publishedAt: '${now}'`;
  const updatedFrontmatter = /^publishedAt\s*:/m.test(fm[2])
    ? fm[2].replace(/^publishedAt\s*:.*$/m, dateLine)
    : `${fm[2]}${newline}${dateLine}`;
  const updated = `${fm[1]}${updatedFrontmatter}${fm[3]}${raw.slice(fm[0].length)}`;
  await writeFile(game.indexPath, updated, 'utf8');
  nextKnown.add(game.name);
  stamped++;
  console.log(`Set publishedAt for ${game.name}: ${now}`);
}

await writeState(nextKnown);
if (!stamped) console.log('No newly published games.');

async function writeState(folders) {
  const data = { version: 1, knownFolders: [...folders].sort((a, b) => a.localeCompare(b)) };
  await writeFile(statePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}