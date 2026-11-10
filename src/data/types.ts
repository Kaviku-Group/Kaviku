// Kaviku - открытый исходный код / open source (AGPL-3.0)
// Сайт: https://kaviku.pages.dev
// GitHub: https://github.com/Kaviku-Group/Kaviku
// SPDX-License-Identifier: AGPL-3.0-only

import type { ImageMetadata } from 'astro';
import type { LocalizedText } from '../i18n';
import type { AgeRating } from './taxonomy';

/**
 * Типы данных каталога. Повторяют будущую структуру таблиц D1
 * (games, authors, studios, genres, tags), чтобы позже источник данных
 * можно было заменить без переделки компонентов.
 */
export interface Genre {
  slug: string;
  name: LocalizedText;
  /** Другие написания, которые считаются этим же жанром/тегом («3Д» = «3D»). */
  aliases?: string[];
}

export interface Tag {
  slug: string;
  name: LocalizedText;
  aliases?: string[];
}

export interface AuthorRef {
  slug: string;
  nickname: string;
}

export interface StudioRef {
  slug: string;
  name: string;
}

/**
 * Изображение игры: файл из папки games/ (оптимизируется при сборке)
 * или готовый URL (например, из Cloudflare R2 в будущем).
 */
export type GameImage = ImageMetadata | string;

export interface GameSummary {
  slug: string;
  /** На каждом языке; выводить через i18n.loc(). */
  title: LocalizedText;
  shortDescription: LocalizedText;
  author: AuthorRef;
  studio?: StudioRef;
  genres: string[]; // slug-и жанров
  tags: string[]; // slug-и тегов
  platforms: string[]; // slug-и платформ (поле os)
  likes: number;
  downloads: number;
  publishedAt: string; // ISO-дата
  updatedAt?: string; // ISO-дата последнего обновления
  /** Языки игры (RU, EN…) — из поля language или определены по текстам. */
  languages: string[];
  /** Возрастная маркировка (0+ … 18+) — отдельно от жанров и тегов. */
  ageRating?: AgeRating;
  cover?: GameImage;
  screenshots: GameImage[];
  /** Ссылки на видео (YouTube, VK Видео, Rutube, .mp4/.webm) — показываются первыми в галерее. */
  videos: string[];
  /** https://… или /downloads/<slug>/<файл> — для файла, лежащего в папке игры. */
  downloadUrl?: string;
  supportUrl?: string;
  version?: string;
  featured: boolean;
}
