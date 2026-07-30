ALTER TABLE accounts ADD COLUMN public_profile_id TEXT;

UPDATE accounts SET public_profile_id = lower(hex(randomblob(12)))
WHERE public_profile_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_public_profile
  ON accounts (public_profile_id);

CREATE TRIGGER IF NOT EXISTS accounts_assign_public_profile
AFTER INSERT ON accounts
WHEN NEW.public_profile_id IS NULL
BEGIN
  UPDATE accounts SET public_profile_id = lower(hex(randomblob(12))) WHERE id = NEW.id;
END;
