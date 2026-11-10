// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from 'astro/zod';
import { ageRatings, normalizeAgeRating } from './taxonomy';
import { parseVideoUrl, SUPPORTED_VIDEO_HINT } from '../lib/video';
import { normalizeLanguage } from '../lib/language';

/**
 * Схема файла games/<папка>/index.md — единая для сборки сайта
 * и для проверки папки при подготовке (npm run game:check).
 *
 * imageField — как проверять пути к картинкам: при сборке это image() из Astro
 * (картинка импортируется и оптимизируется), при предварительной проверке — строка.
 *
 * Жанры и теги — свободный текст: новые значения не ошибка, они автоматически
 * попадают в фильтры каталога (см. src/data/catalog.ts). Проверяется только формат.
 *
 * Имя поля к сообщению добавляется автоматически («shortDescription: …»).
 */

/** Понятные сообщения вместо стандартных «Invalid input…». */
const required = (hint: string) => ({
  error: (issue: { input?: unknown }) => (issue.input === undefined ? `обязательное поле не заполнено — ${hint}` : `неверный формат — ${hint}`),
});

const text = (hint: string, max?: number) => {
  const schema = z.string(required(hint)).trim().min(1, `пустое значение — ${hint}`);
  return max === undefined ? schema : schema.max(max, `не длиннее ${max} символов`);
};

/**
 * Жанр/тег: текст, лишние пробелы убираются.
 * Можно сразу указать перевод через «|»: «Киберпанк | Cyberpunk».
 */
const term = z
  .string({ error: 'должно быть текстом' })
  .transform((v) => v.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(1, 'пустое значение')
      .max(80, 'не длиннее 80 символов')
      .refine((v) => v.split('|').length <= 2 && v.split('|').every((p) => p.trim()), 'формат: «Название» или «Русское | English»'),
  );

/**
 * Язык игры: RU, EN, «Русский», «English», «РУ», «ЕН», любой код (DE, ES…)
 * или любое название языка — незнакомое попадёт в плашку как написано.
 */
const languageCode = z
  .string({ error: 'должно быть текстом' })
  .refine((v) => !!normalizeLanguage(v), 'язык — код (RU, EN, DE…) или название языка буквами, до 20 символов')
  .transform((v) => normalizeLanguage(v)!);

const httpsUrl = z.url({ protocol: /^https$/, error: 'нужна полная ссылка, начинающаяся с https://' });

/**
 * Файл игры внутри папки игры: «./mygame.zip» или «./files/mygame.zip».
 * Существование, размер (до 25 МБ) и формат проверяются в src/lib/game-folder.ts.
 */
export const LOCAL_FILE_RE = /^\.\/(?!.*\.\.)[^\\:*?"<>|]+$/;
const downloadTarget = z.union([httpsUrl, z.string().trim().regex(LOCAL_FILE_RE)], {
  error: 'ссылка https://… или путь к файлу в папке игры, начинающийся с ./ (например, ./mygame.zip)',
});

/** Ссылка на видео: проверяется, что сайт умеет её показать. */
const videoLink = httpsUrl.refine((u) => !!parseVideoUrl(u), `ссылка на видео не распознана — ${SUPPORTED_VIDEO_HINT}`);
const date = z.coerce.date({ error: 'дата в формате ГГГГ-ММ-ДД' });

export function createGameSchema<I extends z.ZodType>(imageField: () => I) {
  return z.strictObject(
    {
      title: text('название игры', 80),
      shortDescription: text('краткое описание для карточки каталога, 1–2 предложения'),
      author: text('никнейм автора', 80),
      studio: text('название студии', 80).optional(),
      genres: z.array(term, required('список жанров, хотя бы один')).min(1, 'укажите хотя бы один жанр'),
      tags: z.array(term, { error: 'должен быть списком' }).default([]),
      /** Платформы (Windows, Linux, macOS, Android…): одна или список. Новые создаются сами. */
      os: z
        .union([term, z.array(term)], { error: 'платформа или список платформ: Windows, Linux…' })
        .optional()
        .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
      /** Языки игры — плашка в левом верхнем углу обложки. Нет поля — определяется автоматически. */
      language: z
        .union([languageCode, z.array(languageCode).min(1, 'укажите хотя бы один язык')], { error: 'язык или список языков: RU, EN…' })
        .optional()
        .transform((v) => (v === undefined ? undefined : [...new Set(Array.isArray(v) ? v : [v])])),
      /** Возрастная маркировка — плашка в правом верхнем углу обложки. Любой возраст «N+». */
      ageRating: z
        .union([z.string(), z.number()], { error: `возраст в формате «12+» (обычно ${ageRatings.join(', ')})` })
        .refine((v) => !!normalizeAgeRating(v), `возраст в формате «12+», от 0+ до 21+ (обычно ${ageRatings.join(', ')})`)
        .transform((v) => normalizeAgeRating(v)!)
        .optional(),
      publishedAt: z
        .unknown()
        .refine((v) => v !== undefined && v !== null && v !== '', 'обязательное поле не заполнено — дата публикации ГГГГ-ММ-ДД')
        .pipe(date),
      updatedAt: date.optional(),
      version: z.coerce.string().trim().optional(),
      cover: imageField().optional(),
      screenshots: z.array(imageField()).default([]),
      /** Видео: одна ссылка или список ссылок. Показываются первыми в ленте скриншотов. */
      videoUrl: z
        .union([videoLink, z.array(videoLink)], { error: `одна ссылка или список ссылок — ${SUPPORTED_VIDEO_HINT}` })
        .optional()
        .transform((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v])),
      /** Ссылка на скачивание (https://…) или файл в папке игры (./mygame.zip, до 25 МБ). */
      downloadUrl: downloadTarget.optional(),
      supportUrl: httpsUrl.optional(),
      /** Необязательный адрес страницы; по умолчанию берётся из имени папки. */
      slug: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'латиница в нижнем регистре, цифры и дефисы')
        .optional(),
      /** Английская версия названия и краткого описания (для страниц /en). Необязательно. */
      en: z
        .strictObject(
          {
            title: text('название на английском', 80).optional(),
            shortDescription: text('краткое описание на английском, 1–2 предложения').optional(),
          },
          { error: (issue) => (issue.code === 'unrecognized_keys' ? `в блоке en неизвестные поля: ${issue.keys.join(', ')} — допустимы title и shortDescription` : 'en: блок с полями title и shortDescription') },
        )
        .optional(),
      featured: z.boolean({ error: 'true или false' }).default(false),
      draft: z.boolean({ error: 'true или false' }).default(false),
    },
    { error: (issue) => (issue.code === 'unrecognized_keys' ? `неизвестные поля: ${issue.keys.join(', ')} — проверьте написание` : undefined) },
  );
}
