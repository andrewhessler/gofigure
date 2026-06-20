CREATE TABLE IF NOT EXISTS session_history
(
  id                       INTEGER PRIMARY KEY,
  completed_timestamp      INTEGER NOT NULL,
  seconds_per_image        INTEGER NOT NULL,
  images                   TEXT NOT NULL
);
