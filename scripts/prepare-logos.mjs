// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

// Готовит веб-версии логотипов из ОРИГИНАЛОВ в assets/logo/original/.
// Оригиналы только читаются и никогда не изменяются.
// Обрезается лишь пустое чёрное поле; знак и надпись не перерисовываются,
// пропорции сохраняются (ресайз всегда пропорциональный), цвета не меняются.
//
// Запуск: npm run logos
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINAL = path.join(root, 'assets/logo/original');
// Обрезанные копии в полном разрешении — исходники, на сайт не публикуются
const CROPPED = path.join(root, 'assets/logo/cropped');
// Только то, что реально использует сайт (попадает в сборку dist)
const OUT = path.join(root, 'public/assets/logo');
const PUBLIC = path.join(root, 'public');
// PNG без потерь, максимальное сжатие (палитру не уменьшаем — цвета логотипа не меняются)
// (параметр effort в sharp включает палитру на 256 цветов — его намеренно не используем)
const pngOpts = { compressionLevel: 9, adaptiveFiltering: true, palette: false };
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };

/** Ищет рамку непустых пикселей (яркость канала выше порога). */
async function contentBox(file, threshold = 24) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (Math.max(data[i], data[i + 1], data[i + 2]) > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1, imgW: info.width, imgH: info.height };
}

/** Обрезает чёрное поле, оставляя небольшой запас (pad), не выходя за края оригинала. */
async function crop(file, padRatio) {
  const b = await contentBox(file);
  const pad = Math.round(Math.max(b.width, b.height) * padRatio);
  const left = Math.max(0, b.left - pad);
  const top = Math.max(0, b.top - pad);
  const right = Math.min(b.imgW, b.left + b.width + pad);
  const bottom = Math.min(b.imgH, b.top + b.height + pad);
  return sharp(file).extract({ left, top, width: right - left, height: bottom - top });
}

/** ICO-файл с PNG-изображениями внутри (поддерживается всеми браузерами). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

await mkdir(OUT, { recursive: true });
await mkdir(CROPPED, { recursive: true });

const fullSrc = path.join(ORIGINAL, 'kaviku-logo-full.png');
const markSrc = path.join(ORIGINAL, 'kaviku-logo-mark.png');

// 1. Полный логотип: обрезанная копия в исходном разрешении + облегчённая для шапки.
const fullCropped = await (await crop(fullSrc, 0.03)).png(pngOpts).toBuffer();
await writeFile(path.join(CROPPED, 'kaviku-logo-full-cropped.png'), fullCropped);
await sharp(fullCropped).resize({ height: 200 }).png(pngOpts).toFile(path.join(OUT, 'kaviku-logo-full-h200.png'));

// 2. Знак: обрезанная копия + квадратная версия (дополнена тем же чёрным фоном) для иконок.
const markCropped = await (await crop(markSrc, 0.03)).png(pngOpts).toBuffer();
await writeFile(path.join(CROPPED, 'kaviku-logo-mark-cropped.png'), markCropped);
await sharp(markCropped).resize({ height: 128 }).png(pngOpts).toFile(path.join(OUT, 'kaviku-logo-mark-h128.png'));

const markMeta = await sharp(markCropped).metadata();
const side = Math.max(markMeta.width, markMeta.height);
const square = await sharp(markCropped)
  .extend({
    top: Math.floor((side - markMeta.height) / 2),
    bottom: Math.ceil((side - markMeta.height) / 2),
    left: Math.floor((side - markMeta.width) / 2),
    right: Math.ceil((side - markMeta.width) / 2),
    background: BLACK,
  })
  .png(pngOpts)
  .toBuffer();
await writeFile(path.join(CROPPED, 'kaviku-logo-mark-square.png'), square);

// 3. Favicon и иконки — пропорциональное уменьшение квадратного знака.
//    icon-512 — превью ссылки (og:image). Набор для PWA-манифеста добавим, когда он понадобится.
const icon = (size) => sharp(square).resize(size, size).png(pngOpts).toBuffer();
for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-512.png', 512]]) {
  await writeFile(path.join(PUBLIC, name), await icon(size));
}
await writeFile(
  path.join(PUBLIC, 'favicon.ico'),
  buildIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, buf: await icon(size) })))),
);

for (const f of ['kaviku-logo-full-cropped.png', 'kaviku-logo-mark-cropped.png', 'kaviku-logo-mark-square.png']) {
  const m = await sharp(path.join(CROPPED, f)).metadata();
  console.log(`${f}: ${m.width}x${m.height}`);
}
console.log('Готово: логотипы и иконки обновлены.');
