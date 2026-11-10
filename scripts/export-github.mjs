// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

// Экспорт проекта для GitHub — без игр и приватных файлов.
//
//   npm run export:github                    → в соседнюю папку ../Kaviku-github
//   npm run export:github -- "D:\путь\папка" → в указанную папку
//
// Папка назначения каждый раз пересобирается заново, но её .git (история репозитория)
// сохраняется — можно спокойно делать commit / push оттуда.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.resolve(process.argv[2] ?? path.join(root, '..', 'Kaviku-github'));

if (target === root || target.startsWith(root + path.sep)) {
  console.error(`Папка экспорта не может быть внутри проекта: ${target}`);
  process.exit(1);
}

/** Что НЕ попадает на GitHub (пути относительно корня проекта, через «/»). */
const EXCLUDE = [
  /^node_modules(\/|$)/,
  /^dist(\/|$)/,
  /^\.astro(\/|$)/,
  /^\.wrangler(\/|$)/, // локальная копия базы D1
  /^\.claude(\/|$)/,
  /^\.git(\/|$)/,
  /^\.dev\.vars$/, // секреты для локальной проверки
  /^\.env(\..*)?$/,
  /^assets\/mockup-paint\.png$/, // личный набросок макета
  /^games\/(?!README\.md$|_template(\/|$)).+/, // игры — кроме инструкции и шаблона
  /(^|\/)Thumbs\.db$/,
  /(^|\/)desktop\.ini$/,
  /(^|\/)\.DS_Store$/,
];

const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const excluded = (p) => {
  const r = rel(p);
  return r !== '' && EXCLUDE.some((re) => re.test(r));
};

// 1. Очищаем папку назначения (кроме .git)
await mkdir(target, { recursive: true });
for (const entry of await readdir(target)) {
  if (entry === '.git') continue;
  await rm(path.join(target, entry), { recursive: true, force: true });
}

// 2. Копируем проект с фильтром
await cp(root, target, { recursive: true, filter: (src) => !excluded(src) });

// 3. .gitignore для репозитория: игры, секреты и сборка никогда не попадут в commit
await writeFile(
  path.join(target, '.gitignore'),
  `# Сборка и зависимости
dist/
.astro/
node_modules/

# Секреты и локальная база (никогда не коммитить)
.dev.vars
.env
.env.*
.wrangler/

# Игры хранятся только локально — в репозитории лишь шаблон и инструкция
games/*
!games/README.md
!games/_template/

# Системное
.DS_Store
Thumbs.db
desktop.ini
.idea/
`,
  'utf8',
);

// 4. Пример файла секретов для локальной проверки (без настоящих значений)
await writeFile(
  path.join(target, '.dev.vars.example'),
  `# Скопируйте в .dev.vars и задайте свои значения (файл .dev.vars не коммитится).
# Подпись cookie посетителей (лайки, скачивания) — любая длинная случайная строка:
VISITOR_SECRET=replace-with-a-long-random-string
`,
  'utf8',
);

// 5. Проверка: ни одно значение из .dev.vars не должно оказаться в экспорте
const secrets = [];
if (existsSync(path.join(root, '.dev.vars'))) {
  for (const line of (await readFile(path.join(root, '.dev.vars'), 'utf8')).split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && m[2].length >= 6) secrets.push({ key: m[1], value: m[2] });
  }
}
let files = 0;
let bytes = 0;
const leaks = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    files++;
    const size = (await stat(full)).size;
    bytes += size;
    if (size > 2 * 1024 * 1024) continue; // большие файлы — картинки, не текст
    const text = await readFile(full, 'utf8').catch(() => '');
    for (const s of secrets) if (text.includes(s.value)) leaks.push(`${path.relative(target, full)} содержит значение ${s.key}`);
  }
}
await walk(target);

if (leaks.length) {
  console.error('ОСТАНОВЛЕНО: в экспорт попали секреты:\n  - ' + leaks.join('\n  - '));
  await rm(target, { recursive: true, force: true });
  process.exit(1);
}

console.log(`Готово: ${target}`);
console.log(`Файлов: ${files}, размер: ${(bytes / 1024 / 1024).toFixed(1)} МБ`);
console.log('Не включено: игры (кроме шаблона), .dev.vars и .env, локальная база, node_modules, dist, набросок макета.');
console.log(`Проверено: секретов из .dev.vars в экспорте нет (${secrets.length} значений проверено).`);
