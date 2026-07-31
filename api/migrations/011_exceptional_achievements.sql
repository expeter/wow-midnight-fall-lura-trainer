CREATE TABLE IF NOT EXISTS exceptional_achievement_grants (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  granted_at TEXT NOT NULL,
  UNIQUE (account_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_exceptional_achievement_grants_audit
  ON exceptional_achievement_grants (granted_at DESC, id DESC);
