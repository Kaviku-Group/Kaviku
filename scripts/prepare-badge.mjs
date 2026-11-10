// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

// Готовит бейдж для страницы «Сайт в разработке» из оригинала в assets/badges/original/.
// Оригинал не изменяется. Копия обрезается по границе карточки (без серо-синего фона вокруг),
// углы скругляются в CSS. Запуск: node scripts/prepare-badge.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'assets/badges/original/kaviku-staff-badge.webp');
const out = path.join(root, 'public/assets/gate/kaviku-staff-badge.webp');

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => (y * info.width + x) * 3;
const bg = [data[at(3, 3)], data[at(3, 3) + 1], data[at(3, 3) + 2]];
const differs = (x, y) => {
  const i = at(x, y);
  return Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) > 24;
};

// Граница карточки: первая/последняя строка и столбец, где много «не фоновых» пикселей
const rowHit = (y) => { let n = 0; for (let x = 0; x < info.width; x++) if (differs(x, y)) n++; return n > info.width * 0.3; };
const colHit = (x) => { let n = 0; for (let y = 0; y < info.height; y++) if (differs(x, y)) n++; return n > info.height * 0.3; };
let top = 0; while (top < info.height && !rowHit(top)) top++;
let bottom = info.height - 1; while (bottom > top && !rowHit(bottom)) bottom--;
let left = 0; while (left < info.width && !colHit(left)) left++;
let right = info.width - 1; while (right > left && !colHit(right)) right--;

await mkdir(path.dirname(out), { recursive: true });
await sharp(src)
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize({ width: 900, withoutEnlargement: true })
  .webp({ quality: 90 })
  .toFile(out);
const m = await sharp(out).metadata();
console.log(`карточка: x ${left}–${right}, y ${top}–${bottom}; итог ${m.width}×${m.height}`);
