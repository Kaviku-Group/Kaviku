// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Все тексты интерфейса на русском (основной язык).
 * Английский - в en.ts: та же структура, TypeScript подскажет пропущенные ключи.
 *
 * Плюральные формы: [одна, несколько, много] - «1 игра», «2 игры», «5 игр».
 */
export const ru = {
  meta: {
    defaultTitle: 'Kaviku - платформа инди-игр',
    defaultDescription:
      'Kaviku - независимая платформа, где разработчики публикуют инди-игры, а игроки находят, изучают и скачивают их.',
    titleSuffix: '- Kaviku',
  },
  lang: {
    label: 'Язык сайта',
    ru: 'RU',
    en: 'EN',
    ruName: 'Русский',
    enName: 'English',
  },
  common: {
    soon: 'Скоро',
    linkSoon: 'Ссылка появится позже',
    close: 'Закрыть',
    by: 'Автор',
  },
  header: {
    homeLabel: 'Kaviku - на главную',
    nav: {
      catalog: 'Каталог',
      featured: 'Игра недели',
    },
    searchPlaceholder: 'Найти игру, автора, тег…',
    searchLabel: 'Поиск игр',
    searchSubmit: 'Искать',
    openSearch: 'Открыть поиск',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    supportSite: 'Поддержать сайт',
  },
  footer: {
    tagline: 'Независимая платформа инди-игр.',
    navTitle: 'Навигация',
    submitGame: 'Предложить игру',
    submitHint: 'Разработчик? Расскажите нам о своей игре.',
    submitSoon: 'Форма подачи заявок скоро откроется',
    ads: 'Реклама',
    openSource: 'Открытый исходный код',
    support: 'Поддержка',
    publicationRules: 'Правила публикации игр',
  },
  featured: {
    title: 'Игра недели',
    open: 'Открыть страницу игры',
    weeklyLikes: ['{n} лайк за неделю', '{n} лайка за неделю', '{n} лайков за неделю'],
  },
  stats: {
    likes: ['лайк', 'лайка', 'лайков'],
    downloads: ['скачивание', 'скачивания', 'скачиваний'],
    likesLabel: 'Лайки',
    downloadsLabel: 'Скачивания',
  },
  catalog: {
    title: 'Каталог игр',
    searchPlaceholder: 'Поиск по названию, автору, студии, тегам…',
    searchLabel: 'Поиск по каталогу',
    clearSearch: 'Очистить поиск',
    filters: 'Фильтры',
    genres: 'Жанры',
    genresHint: 'любой из выбранных',
    tags: 'Теги',
    tagsHint: 'все выбранные',
    platforms: 'Платформы',
    platformsHint: 'любая из выбранных',
    sortLabel: 'Сортировка',
    sort: {
      new: 'Сначала новые',
      likes: 'По лайкам',
      downloads: 'По скачиваниям',
    },
    reset: 'Сбросить всё',
    hideAdult: 'Не показывать игры 18+',
    noAdultChip: 'Без 18+',
    removeFilter: 'Убрать фильтр',
    found: ['Найдена {n} игра', 'Найдены {n} игры', 'Найдено {n} игр'],
    showMore: 'Показать ещё',
    showResults: ['Показать {n} игру', 'Показать {n} игры', 'Показать {n} игр'],
    /** В каталоге вообще нет игр */
    noGamesTitle: 'Упс... Кажется, игр пока нет',
    /** Игры есть, но по запросу/фильтрам ничего не нашлось */
    noMatchesTitle: 'Упс... Кажется, такой игры ещё нет',
    moreTags: '+{n}',
  },
  game: {
    backToCatalog: 'Вернуться в каталог',
    published: 'Опубликована',
    updated: 'Обновлена',
    version: 'Версия',
    download: 'Скачать игру',
    downloadUnavailable: 'Ссылка на скачивание пока недоступна',
    support: 'Поддержать автора',
    like: 'Нравится',
    liked: 'Вам нравится',
    likeError: 'Не получилось сохранить лайк. Попробуйте чуть позже.',
    description: 'Описание',
    screenshots: 'Скриншоты',
    videoAndScreenshots: 'Видео и скриншоты',
    video: 'Видео',
    watchVideo: 'Смотреть видео {n}',
    openScreenshot: 'Открыть скриншот {n} в полном размере',
    screenshotAlt: '{title} - скриншот {n}',
    screenshotCounter: '{n} из {total}',
    /** Когда в ленте видно сразу несколько скриншотов: «1 / 2 из 6» */
    screenshotRange: '{from} / {to} из {total}',
    prev: 'Предыдущий',
    next: 'Следующий',
    ageRating: 'Возрастная маркировка',
    languages: 'Языки игры',
  },
  author: {
    label: 'Автор',
    title: 'Игры автора {name}',
    games: ['{n} игра', '{n} игры', '{n} игр'],
    open: 'Все игры автора {name}',
    allHidden: 'Все игры автора скрыты настройкой «Не показывать игры 18+». Её можно выключить в фильтрах каталога.',
  },
  adult: {
    title: 'Контент для взрослых',
    text: 'Эта игра может содержать жестокость, пугающие сцены, сексуальный контент или другие материалы для лиц старше 18 лет. Перейти к игре?',
    accept: 'Мне есть 18, перейти',
    back: 'Вернуться в каталог',
  },
  notFound: {
    title: 'Страница не найдена',
    text: 'Возможно, ссылка устарела или в адресе опечатка.',
    back: 'На главную',
  },
} as const;
