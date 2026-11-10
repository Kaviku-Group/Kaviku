# Kaviku

Открытый исходный код под лицензией **GNU AGPL-3.0** · Open source under **GNU AGPL-3.0**

- Сайт / Website: https://kaviku.pages.dev
- GitHub: https://github.com/Kaviku-Group/Kaviku

В начале каждого файла кода стоит шапка с лицензией (`SPDX-License-Identifier: AGPL-3.0-only`).
Для новых файлов: `npm run license:headers` — добавит шапку туда, где её ещё нет.

Платформа инди-игр. Astro + TypeScript, хостинг — Cloudflare Pages.

## Запуск локально

```bash
npm install
npm run dev
```

Сайт откроется на http://localhost:4321

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | Локальный сервер с автообновлением |
| `npm run build` | Сборка в папку `dist/` (её публикует Cloudflare Pages) |
| `npm run check` | Проверка типов |
| `npm run logos` | Пересобрать обрезанные логотипы и favicon из оригиналов |
| `npm run game:check -- "путь"` | Проверить готовую папку игры при подготовке |
| `npm run deploy` | Собрать и опубликовать сайт через Wrangler |
| `npm run export:github` | Сделать копию проекта для GitHub (без игр и секретов) в `../Kaviku-github` |

## Копия для GitHub

`npm run export:github` собирает в соседней папке `D:\Kaviku-github` версию проекта для публичного
репозитория. Туда **не попадают**: игры (кроме `games/_template` и `games/README.md`), `.dev.vars` и `.env`,
локальная база `.wrangler`, `node_modules`, `dist`, набросок макета. Скрипт проверяет, что ни одно
значение из `.dev.vars` не оказалось в копии, и создаёт там `.gitignore` и `.dev.vars.example`.
Папку можно пересобирать сколько угодно раз — её `.git` (история репозитория) сохраняется.

## Где что лежит

- `assets/logo/original/` — **оригинальные логотипы, не изменять**
- `public/assets/logo/` — обрезанные копии для сайта (генерирует `npm run logos`)
- `games/` — **игры: одна папка на игру**, инструкция в [games/README.md](games/README.md)
- `src/config/site.ts` — ссылки «Предложить игру» (Google Форма), «Поддержать сайт», картинка маскота
- `src/data/taxonomy.ts` — список жанров и тегов
- `src/styles/tokens.css` — фирменная палитра
- `src/i18n/ru.ts` — все тексты интерфейса

## Лайки и скачивания (Cloudflare D1)

- База: `kaviku` (D1), таблицы — `migrations/0001_likes_downloads.sql`.
- API (Pages Functions, папка `functions/`): `GET /api/stats`, `GET|POST /api/likes/<игра>`,
  `GET /go/download/<игра>` (засчитывает скачивание и перенаправляет на ссылку автора).
- Общий серверный код — `server/`. Посетитель — подписанная cookie (секрет `VISITOR_SECRET`).
- Локальная проверка: `npm run pages:preview` (локальная копия базы в `.wrangler/`).
  В `npm run dev` API нет: счётчики показывают 0, кнопка «Нравится» неактивна.
- Новая миграция: файл `migrations/000N_….sql`, затем
  `npx wrangler d1 migrations apply kaviku --local` и `--remote`.

## Закрытый доступ по паролю — отключён

С 10.11.2026 сайт открыт для всех. Проверка пароля («Сайт в разработке») перенесена в
`archive/staff-gate-middleware.ts` и не публикуется. Серверный код запускается только для
`/api/*` и `/go/*` (`public/_routes.json`) — обычные страницы отдаются как статика, без лимитов.

Чтобы снова закрыть сайт: вернуть файл в `functions/_middleware.ts`, в `public/_routes.json`
поставить `"include": ["/*"]` и опубликовать. Пароль — секрет Cloudflare `SITE_PASSWORD`.

## Новые игры: дата публикации

`npm run deploy` сначала запускает `scripts/stamp-new-games.mjs`: новым папкам в `games/`
(и бывшим черновикам) проставляется `publishedAt` = момент публикации, чтобы «Сначала новые»
работало честно. Список уже опубликованных папок хранится в `games/.published-games.json`.
Сломанная папка не останавливает публикацию — она пропускается с предупреждением.

## Cloudflare Pages

В Cloudflare загружается **только папка `dist/`** (результат `npm run build`), а не вся папка проекта:
в `node_modules/` больше 14 000 файлов, и они не должны попадать на сайт.

- Через Dashboard: Workers & Pages → проект → Create deployment → загрузить папку `dist`.
- Через Wrangler CLI: `npm run deploy` (сборка + публикация в проект `kaviku`).

Оригиналы и обрезанные копии логотипов в полном разрешении лежат в `assets/logo/` и на сайт не публикуются.
