// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'astro/zod';
import { createGameSchema } from '../data/game-schema';
import { genres as baseGenres, tags as baseTags, platforms as basePlatforms, ageRatings, findTermSlug, splitTerm } from '../data/taxonomy';
import { isKnownLanguage } from './language';
import { slugify } from './slug';

export { slugify };

/**
 * Проверка папок игр (games/<папка>/).
 * Используется дважды:
 *  - при сборке сайта: неправильная папка пропускается с предупреждением, сайт собирается дальше;
 *  - при подготовке папки: npm run game:check -- "путь\к\папке" показывает все ошибки сразу.
 */

export const GAME_FILE = 'index.md';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const MAX_IMAGE_MB = 15;

/** Cloudflare Pages не принимает файлы больше 25 МиБ. */
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;
/**
 * Форматы файлов игр, которые можно положить в папку игры и скачивать прямо с сайта.
 * HTML-игры тоже можно: в сборку файл попадает с окончанием «.dl», а отдаёт его функция
 * /go/download строго как скачиваемый файл с исходным именем — открыться как страница
 * сайта он не может. JS, SVG и подобные по-прежнему запрещены.
 */
export const DOWNLOAD_EXT = [
  '.zip', '.7z', '.rar', '.tar', '.gz', '.tgz', '.xz', '.bz2',
  '.exe', '.msi', '.apk', '.aab', '.dmg', '.pkg', '.appimage', '.deb', '.rpm',
  '.jar', '.love', '.x86_64', '.sb3', '.pck',
  '.html', '.htm',
];

/** Под каким именем файл лежит в сборке: «mygame.html» → «mygame.html.dl» (никогда не откроется как страница). */
export const storedDownloadName = (name: string) => `${name}.dl`;

export interface GameFolderReport {
  folder: string; // имя папки
  dir: string; // полный путь
  slug: string; // адрес страницы /games/<slug>
  ok: boolean;
  draft: boolean;
  errors: string[];
  warnings: string[];
  /** Файл игры из папки (downloadUrl: ./…) — копируется в сборку как /downloads/<slug>/<имя>. */
  localDownload?: { file: string; name: string; bytes: number };
}

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

async function checkDownloadFile(dir: string, rel: string, report: GameFolderReport) {
  const file = path.resolve(dir, rel);
  const name = path.basename(file);
  if (!file.startsWith(path.resolve(dir) + path.sep)) {
    report.errors.push(`downloadUrl: файл должен лежать внутри папки игры (${rel})`);
    return;
  }
  const lower = name.toLowerCase();
  if (!DOWNLOAD_EXT.some((ext) => lower.endsWith(ext))) {
    report.errors.push(`downloadUrl: формат «${path.extname(name) || name}» не поддерживается. Подходят: ${DOWNLOAD_EXT.join(' ')}`);
    return;
  }
  const info = await stat(file).catch(() => undefined);
  if (!info?.isFile()) {
    report.errors.push(`downloadUrl: файл не найден — ${rel}`);
    return;
  }
  if (info.size > MAX_DOWNLOAD_BYTES) {
    report.errors.push(
      `downloadUrl: файл весит ${mb(info.size)} МБ — Cloudflare Pages принимает файлы не больше 25 МБ. ` +
        'Загрузите игру на itch.io, Google Drive или GitHub Releases и укажите ссылку https://…',
    );
    return;
  }
  report.localDownload = { file, name, bytes: info.size };
}


/** Отделяет блок данных между линиями --- от текста описания. */
export function splitFrontmatter(contents: string): { data: string; body: string } | undefined {
  const m = contents.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  return m ? { data: m[1], body: m[2] } : undefined;
}

/** Схема для предварительной проверки: картинки — просто пути (их проверяем отдельно ниже). */
const preSchema = createGameSchema(() => z.string().min(1));

function formatIssue(issue: z.core.$ZodIssue): string {
  const where = issue.path.length ? `${issue.path.join('.')}: ` : '';
  return `${where}${issue.message}`;
}

async function checkImage(dir: string, rel: string, label: string, report: GameFolderReport, isCover: boolean) {
  const file = path.resolve(dir, rel);
  if (!file.startsWith(path.resolve(dir) + path.sep)) {
    report.errors.push(`${label}: файл должен лежать внутри папки игры (${rel})`);
    return;
  }
  if (!IMAGE_EXT.has(path.extname(file).toLowerCase())) {
    report.errors.push(`${label}: формат не поддерживается (${rel}). Подходят JPG, PNG, WebP, AVIF, GIF`);
    return;
  }
  const info = await stat(file).catch(() => undefined);
  if (!info?.isFile()) {
    report.errors.push(`${label}: файл не найден — ${rel}`);
    return;
  }
  if (info.size > MAX_IMAGE_MB * 1024 * 1024) {
    report.warnings.push(`${label}: файл весит ${(info.size / 1024 / 1024).toFixed(1)} МБ — лучше до ${MAX_IMAGE_MB} МБ`);
  }
  try {
    const sharp = (await import('sharp')).default;
    const meta = await sharp(file).metadata();
    if (!meta.width || !meta.height) throw new Error('нет размеров');
    if (isCover) {
      const ratio = meta.width / meta.height;
      if (Math.abs(ratio - 16 / 9) > 0.1) {
        report.warnings.push(`обложка ${meta.width}×${meta.height} — не 16:9, края будут обрезаны`);
      }
      if (meta.width < 1280) report.warnings.push(`обложка ${meta.width}px в ширину — лучше от 1280px`);
    }
  } catch {
    report.errors.push(`${label}: файл повреждён или это не картинка — ${rel}`);
  }
}

/** Полная проверка одной папки игры. */
export async function validateGameFolder(dir: string): Promise<GameFolderReport> {
  const folder = path.basename(dir);
  const report: GameFolderReport = { folder, dir, slug: slugify(folder), ok: false, draft: false, errors: [], warnings: [] };

  const raw = await readFile(path.join(dir, GAME_FILE), 'utf8').catch(() => undefined);
  if (raw === undefined) {
    report.errors.push(`нет файла ${GAME_FILE}`);
    return report;
  }
  const parts = splitFrontmatter(raw);
  if (!parts) {
    report.errors.push(`${GAME_FILE}: данные игры должны быть в начале файла между двумя линиями ---`);
    return report;
  }
  let data: unknown;
  try {
    data = parseYaml(parts.data);
  } catch (e) {
    report.errors.push(`${GAME_FILE}: ошибка в записи данных — ${(e as Error).message.split('\n')[0]}`);
    return report;
  }

  const parsed = preSchema.safeParse(data ?? {});
  if (!parsed.success) {
    report.errors.push(...parsed.error.issues.map(formatIssue));
    return report;
  }
  const game = parsed.data;
  report.draft = game.draft;
  if (game.slug) report.slug = game.slug;
  if (!report.slug) report.errors.push('из имени папки не получается адрес страницы — добавьте поле slug: my-game');

  // Новые жанры/теги — не ошибка: они сами появятся в фильтрах каталога
  const newTerm = (kind: string, value: string) => {
    const { primary, translation } = splitTerm(value);
    return translation
      ? `новый ${kind} «${primary}» (EN: «${translation}») — будет добавлен в фильтры`
      : `новый ${kind} «${primary}» — будет добавлен в фильтры; без перевода на английской версии он будет показан как написан (перевод: «${primary} | English»)`;
  };
  for (const g of game.genres) if (!findTermSlug(baseGenres, g)) report.warnings.push(newTerm('жанр', g));
  for (const tg of game.tags) if (!findTermSlug(baseTags, tg)) report.warnings.push(newTerm('тег', tg));
  for (const os of game.os) {
    if (findTermSlug(basePlatforms, os)) continue;
    const { primary, translation } = splitTerm(os);
    report.warnings.push(
      translation
        ? `новая платформа «${primary}» (EN: «${translation}») — будет добавлена в фильтры`
        : `новая платформа «${primary}» — будет добавлена в фильтры; без перевода на английской версии она будет показана как написана (перевод: «${primary} | English»)`,
    );
  }
  if (!game.language) report.warnings.push('нет поля language — языки игры будут определены по текстам');
  for (const lang of game.language ?? []) {
    if (!isKnownLanguage(lang)) report.warnings.push(`новый язык «${lang}» — будет добавлен в плашку как написан`);
  }
  if (game.ageRating && !(ageRatings as readonly string[]).includes(game.ageRating)) {
    report.warnings.push(`возрастная маркировка «${game.ageRating}» — нестандартная, плашка будет показана как есть (обычные: ${ageRatings.join(', ')})`);
  }

  if (game.cover) await checkImage(dir, game.cover, 'обложка', report, true);
  else report.warnings.push('нет обложки — будет показана заглушка');
  for (const [i, shot] of game.screenshots.entries()) await checkImage(dir, shot, `скриншот ${i + 1}`, report, false);

  if (!game.downloadUrl) report.warnings.push('нет ссылки на скачивание (downloadUrl)');
  else if (game.downloadUrl.startsWith('./')) await checkDownloadFile(dir, game.downloadUrl, report);
  if (!parts.body.trim()) report.warnings.push('нет полного описания под второй линией ---');

  // Английская версия — не обязательна, но без неё на /en будет русский текст
  if (!game.en?.shortDescription) report.warnings.push('нет английского краткого описания (en: shortDescription) — на английской версии будет русский текст');
  if (parts.body.trim() && !/<!--\s*en\s*-->/i.test(parts.body)) {
    report.warnings.push('в описании нет английской части (<!-- en -->) — на английской версии будет русский текст');
  }

  report.ok = report.errors.length === 0;
  return report;
}

/** Все папки игр в games/ (кроме _шаблонов и скрытых), с проверкой и поиском одинаковых адресов. */
export async function scanGamesDir(baseDir: string): Promise<GameFolderReport[]> {
  const entries = await readdir(baseDir, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter((e) => e.isDirectory() && !/^[_.]/.test(e.name)).map((e) => path.join(baseDir, e.name));
  const reports = await Promise.all(dirs.map(validateGameFolder));

  const seen = new Map<string, string>();
  for (const r of reports.sort((a, b) => a.folder.localeCompare(b.folder))) {
    if (!r.ok) continue;
    const other = seen.get(r.slug);
    if (other) {
      r.ok = false;
      r.errors.push(`адрес /games/${r.slug} уже занят папкой «${other}» — переименуйте папку или задайте поле slug`);
    } else seen.set(r.slug, r.folder);
  }
  return reports;
}
