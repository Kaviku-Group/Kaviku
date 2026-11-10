// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { ru } from './ru';

/** Та же структура, что у ru.ts, но со своими строками. */
type Widen<T> = T extends string
  ? string
  : T extends readonly [string, string, string]
    ? readonly [string, string, string]
    : { readonly [K in keyof T]: Widen<T[K]> };
export type Messages = Widen<typeof ru>;

/**
 * English UI strings.
 * Plural forms keep the Russian three-slot shape: [one, few, many] - English uses [0] and [2].
 */
export const en: Messages = {
  meta: {
    defaultTitle: 'Kaviku - indie games platform',
    defaultDescription:
      'Kaviku is an independent platform where developers publish indie games and players discover, explore and download them.',
    titleSuffix: '- Kaviku',
  },
  lang: {
    label: 'Site language',
    ru: 'RU',
    en: 'EN',
    ruName: 'Русский',
    enName: 'English',
  },
  common: {
    soon: 'Soon',
    linkSoon: 'Link coming soon',
    close: 'Close',
    by: 'By',
  },
  header: {
    homeLabel: 'Kaviku - home',
    nav: {
      catalog: 'Catalog',
      featured: 'Game of the week',
    },
    searchPlaceholder: 'Find a game, author, tag…',
    searchLabel: 'Search games',
    searchSubmit: 'Search',
    openSearch: 'Open search',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    supportSite: 'Support the site',
  },
  footer: {
    tagline: 'Independent indie games platform.',
    navTitle: 'Navigation',
    submitGame: 'Submit a game',
    submitHint: 'Developer? Tell us about your game.',
    submitSoon: 'Submissions open soon',
    ads: 'Advertising',
    openSource: 'Open source',
    support: 'Support',
    publicationRules: 'Game publishing rules',
  },
  featured: {
    title: 'Game of the week',
    open: 'Open game page',
    weeklyLikes: ['{n} like this week', '{n} likes this week', '{n} likes this week'],
  },
  stats: {
    likes: ['like', 'likes', 'likes'],
    downloads: ['download', 'downloads', 'downloads'],
    likesLabel: 'Likes',
    downloadsLabel: 'Downloads',
  },
  catalog: {
    title: 'Game catalog',
    searchPlaceholder: 'Search by title, author, studio, tags…',
    searchLabel: 'Search the catalog',
    clearSearch: 'Clear search',
    filters: 'Filters',
    genres: 'Genres',
    genresHint: 'any of selected',
    tags: 'Tags',
    tagsHint: 'all selected',
    platforms: 'Platforms',
    platformsHint: 'any of selected',
    sortLabel: 'Sort',
    sort: {
      new: 'Newest first',
      likes: 'Most liked',
      downloads: 'Most downloaded',
    },
    reset: 'Reset all',
    hideAdult: 'Hide 18+ games',
    noAdultChip: 'No 18+',
    removeFilter: 'Remove filter',
    found: ['{n} game found', '{n} games found', '{n} games found'],
    showMore: 'Show more',
    showResults: ['Show {n} game', 'Show {n} games', 'Show {n} games'],
    noGamesTitle: 'Oops... Looks like there are no games yet',
    noMatchesTitle: 'Oops... Looks like that game isn’t here yet',
    moreTags: '+{n}',
  },
  game: {
    backToCatalog: 'Back to catalog',
    published: 'Published',
    updated: 'Updated',
    version: 'Version',
    download: 'Download game',
    downloadUnavailable: 'Download link is not available yet',
    support: 'Support the author',
    like: 'Like',
    liked: 'Liked',
    likeError: 'Couldn’t save your like. Please try again a bit later.',
    description: 'Description',
    screenshots: 'Screenshots',
    videoAndScreenshots: 'Videos and screenshots',
    video: 'Video',
    watchVideo: 'Watch video {n}',
    openScreenshot: 'Open screenshot {n} in full size',
    screenshotAlt: '{title} - screenshot {n}',
    screenshotCounter: '{n} of {total}',
    screenshotRange: '{from} / {to} of {total}',
    prev: 'Previous',
    next: 'Next',
    ageRating: 'Age rating',
    languages: 'Game languages',
  },
  author: {
    label: 'Author',
    title: 'Games by {name}',
    games: ['{n} game', '{n} games', '{n} games'],
    open: 'All games by {name}',
    allHidden: 'All of this author’s games are hidden by the “Hide 18+ games” setting. You can turn it off in the catalog filters.',
  },
  adult: {
    title: 'Mature content',
    text: 'This game may contain violence, frightening scenes, sexual content, or other material intended for adults over 18. Continue to the game?',
    accept: 'I’m 18+, continue',
    back: 'Back to catalog',
  },
  notFound: {
    title: 'Page not found',
    text: 'The link may be outdated or there’s a typo in the address.',
    back: 'Go home',
  },
};
