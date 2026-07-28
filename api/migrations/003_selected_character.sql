ALTER TABLE accounts
  ADD COLUMN selected_character_id INTEGER
  REFERENCES characters(id) ON DELETE SET NULL;
