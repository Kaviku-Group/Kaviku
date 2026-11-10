-- Kaviku - открытый исходный код / open source (AGPL-3.0)
-- Сайт: https://kaviku.pages.dev
-- GitHub: https://github.com/Kaviku-Group/Kaviku
-- SPDX-License-Identifier: AGPL-3.0-only

-- Kaviku: лайки и скачивания.
-- Игры хранятся в папках games/, поэтому здесь они обозначаются адресом (slug).

-- Анонимные посетители (подписанная cookie). user_id — для будущих аккаунтов:
-- при входе в аккаунт лайки посетителя можно будет перенести на пользователя.
CREATE TABLE visitors (
  id         TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  user_id    TEXT
);

-- Итоговые счётчики по играм (читаются одним запросом для всего каталога).
CREATE TABLE game_stats (
  slug      TEXT PRIMARY KEY,
  likes     INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0
);

-- Один лайк на посетителя для каждой игры.
CREATE TABLE likes (
  slug       TEXT NOT NULL,
  visitor_id TEXT NOT NULL REFERENCES visitors(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (slug, visitor_id)
);
CREATE INDEX likes_by_visitor ON likes (visitor_id);

-- Скачивание засчитывается не чаще раза в сутки от одного посетителя.
CREATE TABLE downloads (
  slug       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  day        TEXT NOT NULL, -- ГГГГ-ММ-ДД (UTC)
  ip_hash    TEXT NOT NULL,
  PRIMARY KEY (slug, visitor_id, day)
);
CREATE INDEX downloads_by_ip ON downloads (slug, ip_hash, day);

-- Ограничение частоты действий (дополнительный сигнал по хэшу IP; сам IP не хранится).
CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
