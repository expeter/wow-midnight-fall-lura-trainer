ALTER TABLE attempts ADD COLUMN verified_difficulty TEXT;
ALTER TABLE results ADD COLUMN verified_difficulty TEXT;
ALTER TABLE results ADD COLUMN run_eligible INTEGER NOT NULL DEFAULT 1 CHECK (run_eligible IN (0, 1));

UPDATE attempts SET verified_difficulty = difficulty WHERE verified_difficulty IS NULL;
UPDATE results SET verified_difficulty = difficulty WHERE verified_difficulty IS NULL;

CREATE TABLE IF NOT EXISTS achievement_catalog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')),
  points INTEGER NOT NULL CHECK (points IN (10, 25, 50, 100, 200)),
  season INTEGER NOT NULL CHECK (season > 0),
  introduced_version TEXT NOT NULL,
  retired_version TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_achievements_hall
  ON account_achievements (account_id, achievement_id, first_earned_at);

INSERT OR IGNORE INTO achievements (id, trainer_version, title)
SELECT DISTINCT
  CASE
    WHEN aa.achievement_id = 'movement-master' AND COALESCE(r.verified_difficulty, r.difficulty) = 'normal' THEN 'ready-for-raid-night'
    WHEN aa.achievement_id = 'movement-master' AND COALESCE(r.verified_difficulty, r.difficulty) = 'hard' THEN 'midnight-shift'
    WHEN aa.achievement_id = 'flawless' AND COALESCE(r.verified_difficulty, r.difficulty) = 'normal' THEN 'not-a-scratch'
    ELSE 'legacy-flawless'
  END,
  aa.trainer_version,
  CASE WHEN aa.achievement_id = 'flawless' THEN 'Legacy Flawless' ELSE 'Legacy Movement Master' END
FROM account_achievements aa
JOIN results r ON r.attempt_id = aa.source_attempt_id
WHERE aa.achievement_id IN ('movement-master', 'flawless');

INSERT OR IGNORE INTO account_achievements (
  account_id, character_id, achievement_id, trainer_version,
  build_id, source_attempt_id, first_earned_at
)
SELECT aa.account_id, aa.character_id,
  CASE
    WHEN aa.achievement_id = 'movement-master' AND COALESCE(r.verified_difficulty, r.difficulty) = 'normal' THEN 'ready-for-raid-night'
    WHEN aa.achievement_id = 'movement-master' AND COALESCE(r.verified_difficulty, r.difficulty) = 'hard' THEN 'midnight-shift'
    WHEN aa.achievement_id = 'flawless' AND COALESCE(r.verified_difficulty, r.difficulty) = 'normal' THEN 'not-a-scratch'
    ELSE 'legacy-flawless'
  END,
  aa.trainer_version, aa.build_id, aa.source_attempt_id, aa.first_earned_at
FROM account_achievements aa
JOIN results r ON r.attempt_id = aa.source_attempt_id
WHERE aa.achievement_id IN ('movement-master', 'flawless');
