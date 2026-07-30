CREATE TABLE IF NOT EXISTS anonymous_wipe_events (
  id INTEGER PRIMARY KEY,
  phase TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('normal', 'hard')),
  reason TEXT NOT NULL,
  trainer_version TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anonymous_wipe_events_recent
  ON anonymous_wipe_events (occurred_at DESC, id DESC);
