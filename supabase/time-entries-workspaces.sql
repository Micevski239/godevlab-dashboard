-- Split time tracking by workspace so each employee can have
-- one active GoGevgelija session and one active GoDevLab session.

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS workspace TEXT;

UPDATE time_entries
SET workspace = 'gogevgelija'
WHERE workspace IS NULL;

ALTER TABLE time_entries
  ALTER COLUMN workspace SET DEFAULT 'gogevgelija';

ALTER TABLE time_entries
  ALTER COLUMN workspace SET NOT NULL;

ALTER TABLE time_entries
  DROP CONSTRAINT IF EXISTS time_entries_workspace_check;

ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_workspace_check
  CHECK (workspace IN ('gogevgelija', 'godevlab'));

CREATE INDEX IF NOT EXISTS idx_time_entries_employee_workspace
  ON time_entries(employee_id, workspace);

CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_active_workspace
  ON time_entries(employee_id, workspace)
  WHERE clock_out IS NULL;
