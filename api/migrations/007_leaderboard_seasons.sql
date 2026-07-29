ALTER TABLE attempts
  ADD COLUMN leaderboard_season TEXT NOT NULL DEFAULT 'season-1';

ALTER TABLE results
  ADD COLUMN leaderboard_season TEXT NOT NULL DEFAULT 'season-1';

CREATE INDEX IF NOT EXISTS idx_results_season_board
  ON results (
    leaderboard_season, difficulty, duty,
    score DESC, duration_ms, accepted_at
  );
