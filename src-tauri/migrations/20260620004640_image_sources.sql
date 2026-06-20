CREATE TABLE IF NOT EXISTS image_sources
(
  path                     TEXT PRIMARY KEY NOT NULL,
  active                   BOOLEAN NOT NULL DEFAULT 1
);
