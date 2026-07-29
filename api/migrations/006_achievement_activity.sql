CREATE TABLE IF NOT EXISTS achievement_events (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  trainer_version TEXT NOT NULL,
  source_attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  occurred_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_achievement_events_first_earned
  ON achievement_events (account_id, character_id, achievement_id, trainer_version);

CREATE INDEX IF NOT EXISTS idx_achievement_events_recent
  ON achievement_events (occurred_at DESC, id DESC);
