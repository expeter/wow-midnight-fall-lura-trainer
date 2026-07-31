ALTER TABLE attempt_summaries ADD COLUMN idempotency_key_hash TEXT;
ALTER TABLE attempt_summaries ADD COLUMN completion_hash TEXT;
ALTER TABLE attempt_summaries ADD COLUMN achievement_ids_json TEXT NOT NULL DEFAULT '[]';

DELETE FROM account_achievements
WHERE rowid NOT IN (
  SELECT MIN(rowid)
  FROM account_achievements
  GROUP BY account_id, achievement_id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_achievements_once
  ON account_achievements (account_id, achievement_id);
