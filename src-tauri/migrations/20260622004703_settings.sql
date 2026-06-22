CREATE TABLE IF NOT EXISTS settings
(
  sound_at_15              BOOLEAN NOT NULL,
  sound_at_60              BOOLEAN NOT NULL,
  sound_at_half            BOOLEAN NOT NULL,
  sound_on_next_image      BOOLEAN NOT NULL,
  no_repeat_behavior       TEXT NOT NULL,
  no_repeat_size           INTEGER NOT NULL,
  review_after_session     BOOLEAN NOT NULL
);
