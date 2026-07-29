CREATE TABLE IF NOT EXISTS wipe_events (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('normal', 'hard')),
  reason TEXT NOT NULL,
  trainer_version TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wipe_events_recent
  ON wipe_events (occurred_at DESC, id DESC);
