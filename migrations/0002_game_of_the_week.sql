-- Kaviku - открытый исходный код / open source (AGPL-3.0)
-- Сайт: https://kaviku.pages.dev
-- GitHub: https://github.com/Kaviku-Group/Kaviku
-- SPDX-License-Identifier: AGPL-3.0-only

-- Kaviku: «Игра недели» — победитель фиксируется один раз на неделю
-- (первым запросом после понедельника 00:00 по Москве) и больше не меняется.
CREATE TABLE weekly_featured (
  week_start   INTEGER PRIMARY KEY, -- начало недели (понедельник 00:00 МСК), мс UTC
  slug         TEXT NOT NULL,       -- игра-победитель
  weekly_likes INTEGER NOT NULL,    -- лайков за прошедшую неделю
  decided_at   INTEGER NOT NULL     -- когда выбрана (мс UTC)
);

-- Быстрый подсчёт лайков за период
CREATE INDEX likes_by_time ON likes (created_at);
