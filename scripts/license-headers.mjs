// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

// Добавляет шапку с лицензией во все файлы кода, где возможны комментарии.
// Повторный запуск безопасен: файлы, где шапка уже есть, не меняются.
//
//   npm run license:headers
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARK = 'SPDX-License-Identifier: AGPL-3.0-only';
const LINES = [
  'Kaviku - открытый исходный код / open source (AGPL-3.0)',
  'Сайт: https://kaviku.pages.dev',
  'GitHub: https://github.com/Kaviku-Group/Kaviku',
  MARK,
];

/** Какие папки и файлы обрабатывать. Игры, зависимости и сборка не трогаются. */
const DIRS = ['src', 'functions', 'server', 'scripts', 'migrations', 'archive', 'public'];
const ROOT_FILES = ['astro.config.mjs', 'wrangler.toml'];

const style = (file) => {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file);
  if (['.ts', '.mjs', '.js', '.cjs'].includes(ext)) return 'slash';
  if (ext === '.astro') return 'astro';
  if (ext === '.css') return 'block';
  if (ext === '.sql') return 'sql';
  if (ext === '.toml' || base === '_headers' || base === 'robots.txt') return 'hash';
  return null;
};

function withHeader(text, kind) {
  const bom = text.startsWith('﻿') ? '﻿' : '';
  let body = bom ? text.slice(1) : text;
  const nl = body.includes('\r\n') ? '\r\n' : '\n';
  const slash = LINES.map((l) => `// ${l}`).join(nl);
  switch (kind) {
    case 'slash': {
      // «// @ts-check» должен оставаться первой строкой файла
      const first = body.match(/^\/\/ @ts-check\r?\n/);
      if (first) return bom + first[0] + slash + nl + nl + body.slice(first[0].length);
      return bom + slash + nl + nl + body;
    }
    case 'astro':
      // Комментарий в блоке --- … --- (в HTML страницы он не попадает)
      if (/^---\r?\n/.test(body)) return bom + body.replace(/^---\r?\n/, `---${nl}${slash}${nl}${nl}`);
      return bom + `---${nl}${slash}${nl}---${nl}${nl}` + body;
    case 'block':
      return bom + `/*${nl}${LINES.map((l) => ` * ${l}`).join(nl)}${nl} */${nl}${nl}` + body;
    case 'sql':
      return bom + LINES.map((l) => `-- ${l}`).join(nl) + nl + nl + body;
    case 'hash':
      return bom + LINES.map((l) => `# ${l}`).join(nl) + nl + nl + body;
  }
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let changed = 0;
let skipped = 0;
const files = [...ROOT_FILES.map((f) => path.join(root, f))];
for (const dir of DIRS) for await (const f of walk(path.join(root, dir))) files.push(f);

for (const file of files) {
  const kind = style(file);
  if (!kind) continue;
  const text = await readFile(file, 'utf8').catch(() => null);
  if (text === null) continue;
  if (text.includes(MARK)) {
    skipped++;
    continue;
  }
  await writeFile(file, withHeader(text, kind), 'utf8');
  changed++;
  console.log(`+ ${path.relative(root, file)}`);
}
console.log(`Шапка добавлена: ${changed} файлов; уже была: ${skipped}.`);
