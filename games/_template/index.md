---
# RU: Готовый шаблон папки игры. Папки с именем, начинающимся на «_», не публикуются.
# EN: Ready-to-use game folder template. Folders whose names start with "_" are not published.
# RU: Скопируйте эту папку в games/, переименуйте её, заполните index.md и добавьте файлы игры.
# EN: Copy this folder into games/, rename it, fill in index.md, and add the game's files.
# RU: Проверить папку можно командой: npm run game:check -- "путь\к\папке"
# EN: Validate a game folder with: npm run game:check -- "path\to\folder"
# RU: Строки, начинающиеся с #, — комментарии для разработчика; их можно оставить или удалить.
# EN: Lines starting with # are developer comments; you can keep or remove them.

# RU: Адрес страницы (необязательно). Если slug не указан, адрес создаётся из имени папки.
# EN: Page URL slug (optional). If omitted, the slug is generated from the folder name.
# RU: Укажите только часть после /games/, без слэшей: латиница в нижнем регистре, цифры и дефисы.
# EN: Enter only the part after /games/, without slashes: lowercase Latin letters, digits, and hyphens.
# RU: Например, slug: my-game-page создаст адреса /games/my-game-page и /en/games/my-game-page.
# EN: For example, slug: my-game-page creates /games/my-game-page and /en/games/my-game-page.
# slug: my-game-page

# RU: Название игры — обязательное поле, до 80 символов.
# EN: Game title is required and must be no longer than 80 characters.
title: Название игры

# RU: Краткое описание обязательно. Оно показывается в карточке, блоке «Игра недели» и на странице игры.
# EN: A short description is required. It appears on the game card, featured game section, and game page.
# RU: Обычно достаточно 1–2 предложений. Ограничения в 200 символов нет.
# EN: One or two sentences are usually enough. There is no 200-character limit.
# RU: Чтобы сделать часть текста ссылкой, используйте [text = Скачать EXE, url = (https://example.com/game.exe)].
# EN: To turn text into a link, use [text = Download EXE, url = (https://example.com/game.exe)].
# RU: Запятую перед url можно опустить. Также работает Markdown: [Скачать EXE](https://example.com/game.exe).
# EN: The comma before url is optional. Markdown links also work: [Download EXE](https://example.com/game.exe).
# RU: Заключите всё значение в одинарные кавычки, если добавляете ссылку; ссылка должна начинаться с https://.
# EN: Wrap the whole value in single quotes when adding a link; the URL must start with https://.
shortDescription: Одно-два предложения о том, что это за игра и чем она цепляет.

# RU: Английские название и краткое описание (необязательно, но рекомендуется для /en).
# EN: English title and short description (optional, but recommended for /en pages).
# RU: Если блока en нет или в нём нет нужного поля, на английской странице будет русский текст.
# EN: If the en block or one of its fields is missing, the English page falls back to the Russian text.
en:
  title: Game title
  # RU: Английское краткое описание поддерживает те же два формата ссылок.
  # EN: The English short description supports the same two link formats.
  # RU: Примеры: [text = Download EXE, url = (https://example.com/game.exe)] или [Download EXE](https://example.com/game.exe).
  # EN: Examples: [text = Download EXE, url = (https://example.com/game.exe)] or [Download EXE](https://example.com/game.exe).
  shortDescription: One or two sentences about the game and what makes it fun.

# RU: Никнейм автора — обязательное поле. studio — необязательное название студии; удалите его, если студии нет.
# EN: Author nickname is required. studio is the optional studio name; remove it if there is no studio.
author: nickname
studio: Название студии

# RU: Укажите хотя бы один жанр. Можно использовать любой текст; новые жанры автоматически добавятся в фильтры.
# EN: Add at least one genre. Any text is allowed; new genres are added to the catalog filters automatically.
# RU: Для стандартных жанров переводы RU/EN берутся из games/README.md. Для нового жанра задайте перевод через |.
# EN: Standard genre translations are listed in games/README.md. Add a translation for a new genre with |.
# RU: Пример: Киберпанк | Cyberpunk.
# EN: Example: Киберпанк | Cyberpunk.
genres:
  - Приключение
  - Головоломка

# RU: Теги необязательны; используйте tags: [], если тегов нет. Новые теги автоматически появятся в фильтрах.
# EN: Tags are optional; use tags: [] if there are none. New tags are added to the filters automatically.
# RU: Перевод тега также задаётся через |, например: Одиночная игра | Singleplayer.
# EN: Add a tag translation with | as well, for example: Одиночная игра | Singleplayer.
tags:
  - 2D
  - Одиночная игра

# RU: Платформы необязательны — синие значки под жанрами и тегами и фильтр «Платформы». Одна или список.
# EN: Platforms are optional — blue chips under genres and tags, plus the "Platforms" filter. One or a list.
# RU: Базовые: Windows, Linux, macOS, Android, iOS, Браузер (Web/HTML5), Steam Deck. Новые появятся сами.
# EN: Built-in: Windows, Linux, macOS, Android, iOS, Browser (Web/HTML5), Steam Deck. New ones are added automatically.
os: [Windows, Linux]

# RU: Языки игры — необязательные значки в левом верхнем углу обложки. Укажите код или название языка.
# EN: Game languages are optional badges in the top-left corner of the cover. Enter a language code or name.
# RU: Можно указать один язык или список, например RU, EN, DE или [RU, EN]. Неизвестные языки тоже отображаются.
# EN: Enter one language or a list, such as RU, EN, DE, or [RU, EN]. Unknown languages are displayed too.
# RU: Если поле убрать, языки будут определены по текстам игры.
# EN: If this field is omitted, languages are detected from the game's text.
language: [RU, EN]

# RU: Возрастная маркировка — необязательный значок в правом верхнем углу обложки. Формат: N+, например '12+'.
# EN: Age rating is an optional badge in the top-right corner of the cover. Use the N+ format, for example '12+'.
# RU: Обычно используются 0+, 6+, 12+, 16+ и 18+, но можно указать любой возраст от 0+ до 21+.
# EN: Common ratings are 0+, 6+, 12+, 16+, and 18+, but any rating from 0+ to 21+ is accepted.
ageRating: '12+'

# RU: Дата новой игры автоматически записывается при первом npm run deploy; укажите ниже примерное значение.
# EN: A new game's publication date is set automatically on the first npm run deploy; the value below is a placeholder.
# RU: Скрипт обновляет games/.published-games.json. Добавляйте и коммитьте этот файл вместе с игрой, чтобы следующие deploy распознали её.
# EN: The script updates games/.published-games.json. Add and commit this file with the game so future deploys recognize it.
# RU: После первой публикации можно исправить дату вручную. Для точного порядка в один день укажите время и часовой пояс.
# EN: After the first publication, you can edit the date manually. Add a time and timezone to order games published on the same day.
# RU: Пример даты и времени: '2026-11-04T14:30:00+01:00'. updatedAt — необязательная дата последнего обновления.
# EN: Example timestamp: '2026-11-04T14:30:00+01:00'. updatedAt is the optional last-updated date.
publishedAt: 2026-11-04
updatedAt: 2026-11-04

# RU: Версия игры необязательна; при необходимости заключите её в кавычки.
# EN: Game version is optional; quote it if needed.
version: '1.0'

# RU: Обложка необязательна (без неё будет заглушка). Положите файл в папку игры; рекомендуемый формат — 16:9.
# EN: Cover is optional (a placeholder is shown if omitted). Put it in the game folder; 16:9 is recommended.
# RU: Поддерживаются JPG, PNG, WebP, AVIF и GIF; рекомендуется ширина не менее 1280 px.
# EN: Supported formats are JPG, PNG, WebP, AVIF, and GIF; a width of at least 1280 px is recommended.
cover: ./cover.jpg

# RU: Скриншоты необязательны. Положите их в папку screenshots и перечислите пути ниже.
# EN: Screenshots are optional. Put them in the screenshots folder and list their paths below.
# RU: Если скриншотов нет, удалите поле целиком или укажите screenshots: [].
# EN: If there are no screenshots, remove this field or set screenshots: [].
screenshots:
  - ./screenshots/01.jpg
  - ./screenshots/02.jpg

# RU: Видео необязательно и показывается первым в галерее. Укажите одну ссылку или список поддерживаемых ссылок.
# EN: Video is optional and appears first in the gallery. Enter one supported link or a list of links.
# RU: Поддерживаются YouTube, VK Видео, Rutube и прямые ссылки на MP4/WebM. Если видео нет, удалите все строки videoUrl.
# EN: YouTube, VK Video, Rutube, and direct MP4/WebM links are supported. If there is no video, remove all videoUrl lines.
# RU: Примеры для списка:
# EN: List examples:
videoUrl: https://www.youtube.com/watch?v=XXXXXXXXXXX
# videoUrl:
#   - https://youtu.be/XXXXXXXXXXX
#   - https://rutube.ru/video/0123456789abcdef0123456789abcdef/

# RU: Скачивание необязательно. Два варианта:
# EN: Download is optional. Two options:
# RU: 1) ссылка https://… на itch.io, GitHub Releases, Google Drive и т. п.;
# EN: 1) an https://… link to itch.io, GitHub Releases, Google Drive, etc.;
# RU: 2) файл игры прямо в этой папке: downloadUrl: ./mygame.zip — кнопка «Скачать» скачает его с сайта.
# EN: 2) the game file right in this folder: downloadUrl: ./mygame.zip — the Download button serves it from the site.
# RU: Файл в папке — НЕ БОЛЬШЕ 25 МБ (ограничение Cloudflare). Форматы: zip 7z rar exe msi apk dmg appimage и др.
# EN: A file in the folder must be AT MOST 25 MB (Cloudflare limit). Formats: zip 7z rar exe msi apk dmg appimage, etc.
downloadUrl: https://example.com/download

# RU: Ссылка поддержки автора необязательна; удалите поле, если её нет.
# EN: Support link is optional; remove this field if there is none.
supportUrl: https://example.com/support

# RU: Игра недели выбирается автоматически по лайкам за неделю. featured: true используется только как запасной вариант.
# EN: The featured game is selected automatically by weekly likes. Set featured: true only as a fallback.
featured: false

# RU: Черновик не показывается на сайте. Установите true, чтобы пока скрыть игру.
# EN: Drafts are hidden from the website. Set this to true to keep the game unpublished for now.
draft: false
---

<!-- RU: Это полное описание на русском. Ниже можно использовать Markdown: заголовки, списки, **жирный**, *курсив* и ссылки. -->
<!-- EN: This is the full Russian description. You can use Markdown: headings, lists, **bold**, *italic*, and links. -->
<!-- RU: Не удаляйте маркеры ru и en: по ним сайт разделяет описания для языковых версий. -->
<!-- EN: Keep the ru and en markers: the site uses them to split descriptions by language. -->
<!-- ru -->

<!--
RU: Ссылка в полном описании: [text = Скачать EXE-файл, url = (https://example.com/game.exe)]
RU: Или Markdown: [Скачать EXE-файл](https://example.com/game.exe)
EN: Link in the full description: [text = Download the EXE file, url = (https://example.com/game.exe)]
EN: Or use Markdown: [Download the EXE file](https://example.com/game.exe)
RU: Ссылки открываются в новой вкладке. Используйте URL, начинающийся с https://.
EN: Links open in a new tab. Use a URL that starts with https://.
RU/EN: Этот HTML-комментарий не отображается на сайте / This HTML comment is hidden on the website.
-->

## Об игре

Полное описание игры: абзацы, заголовки (## и ###), **жирный**, *курсив*, списки.

## Как играть

- Пункт списка
- Ещё один пункт

## Системные требования

- ОС: Windows 10
- Память: 4 ГБ

<!-- EN: This is the full English description. Use the same Markdown features and link formats as in the Russian section. -->
<!-- en -->

## About the game

Full description of the game: paragraphs, headings (## and ###), **bold**, *italic*, lists.

## How to play

- List item
- Another item

## System requirements

- OS: Windows 10
- Memory: 4 GB
