CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY,
  battle_net_region TEXT NOT NULL CHECK (battle_net_region IN ('eu', 'us')),
  battle_net_account_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (battle_net_region, battle_net_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  csrf_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  region TEXT NOT NULL CHECK (region IN ('eu', 'us')),
  character_id TEXT NOT NULL,
  realm_id TEXT NOT NULL,
  realm_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  class_name TEXT,
  faction TEXT,
  guild_id TEXT,
  guild_name TEXT,
  guild_realm TEXT,
  refreshed_at TEXT NOT NULL,
  UNIQUE (region, character_id)
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  identity_mode TEXT NOT NULL DEFAULT 'anonymous'
    CHECK (identity_mode IN ('anonymous', 'alias', 'character')),
  alias TEXT,
  show_guild INTEGER NOT NULL DEFAULT 0 CHECK (show_guild IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  nonce_hash TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('normal', 'hard')),
  duty TEXT NOT NULL CHECK (duty IN ('crystal', 'non-crystal')),
  entry_mode TEXT NOT NULL,
  phase_scope TEXT NOT NULL,
  trainer_version TEXT NOT NULL,
  build_id TEXT NOT NULL,
  configuration_json TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE TABLE IF NOT EXISTS attempt_summaries (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE,
  duration_ms INTEGER NOT NULL,
  phase_results_json TEXT NOT NULL,
  mistakes_json TEXT NOT NULL,
  actions_json TEXT NOT NULL,
  accepted_score INTEGER NOT NULL,
  submitted_score INTEGER NOT NULL,
  accepted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('normal', 'hard')),
  duty TEXT NOT NULL CHECK (duty IN ('crystal', 'non-crystal')),
  score INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  trainer_version TEXT NOT NULL,
  build_id TEXT NOT NULL,
  accepted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT NOT NULL,
  trainer_version TEXT NOT NULL,
  title TEXT NOT NULL,
  currently_obtainable INTEGER NOT NULL DEFAULT 1 CHECK (currently_obtainable IN (0, 1)),
  PRIMARY KEY (id, trainer_version)
);

CREATE TABLE IF NOT EXISTS account_achievements (
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  trainer_version TEXT NOT NULL,
  build_id TEXT NOT NULL,
  source_attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  first_earned_at TEXT NOT NULL,
  PRIMARY KEY (account_id, character_id, achievement_id, trainer_version),
  FOREIGN KEY (achievement_id, trainer_version)
    REFERENCES achievements(id, trainer_version)
);

CREATE INDEX IF NOT EXISTS idx_results_board
  ON results (difficulty, duty, trainer_version, score DESC, duration_ms, accepted_at);
CREATE INDEX IF NOT EXISTS idx_characters_public_search
  ON characters (name COLLATE NOCASE, realm_slug COLLATE NOCASE, guild_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_privacy_alias
  ON privacy_settings (alias COLLATE NOCASE);
