CREATE TABLE IF NOT EXISTS saved_config
(
  id                       INTEGER PRIMARY KEY,
  seconds_per_image        INTEGER NOT NULL,
  image_count              INTEGER NOT NULL
);
