ALTER TABLE attempt_summaries ADD COLUMN client_run_id TEXT;

CREATE INDEX IF NOT EXISTS idx_attempt_summaries_client_run_id
  ON attempt_summaries (client_run_id);
