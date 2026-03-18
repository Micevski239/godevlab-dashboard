-- GoDevLab workspace schema
-- Run this after the base employee schema so the foreign keys to employees exist.

CREATE TABLE IF NOT EXISTS godevlab_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS godevlab_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS godevlab_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'active', 'review', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS godevlab_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES godevlab_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date DATE,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS godevlab_project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES godevlab_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'progress'
    CHECK (update_type IN ('progress', 'note', 'blocker', 'decision')),
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_godevlab_posts_created_at
  ON godevlab_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_godevlab_notes_created_at
  ON godevlab_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_godevlab_projects_status
  ON godevlab_projects(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_godevlab_project_tasks_project
  ON godevlab_project_tasks(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_godevlab_project_updates_project
  ON godevlab_project_updates(project_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_godevlab_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_godevlab_projects_updated_at ON godevlab_projects;
CREATE TRIGGER trg_godevlab_projects_updated_at
  BEFORE UPDATE ON godevlab_projects
  FOR EACH ROW
  EXECUTE FUNCTION set_godevlab_updated_at();

DROP TRIGGER IF EXISTS trg_godevlab_project_tasks_updated_at ON godevlab_project_tasks;
CREATE TRIGGER trg_godevlab_project_tasks_updated_at
  BEFORE UPDATE ON godevlab_project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_godevlab_updated_at();

ALTER TABLE godevlab_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE godevlab_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE godevlab_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE godevlab_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE godevlab_project_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GoDevLab posts are visible to authenticated users" ON godevlab_posts;
CREATE POLICY "GoDevLab posts are visible to authenticated users"
  ON godevlab_posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "GoDevLab posts can be inserted by author" ON godevlab_posts;
CREATE POLICY "GoDevLab posts can be inserted by author"
  ON godevlab_posts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "GoDevLab posts can be updated by author or admin" ON godevlab_posts;
CREATE POLICY "GoDevLab posts can be updated by author or admin"
  ON godevlab_posts FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab posts can be deleted by author or admin" ON godevlab_posts;
CREATE POLICY "GoDevLab posts can be deleted by author or admin"
  ON godevlab_posts FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab notes are visible to authenticated users" ON godevlab_notes;
CREATE POLICY "GoDevLab notes are visible to authenticated users"
  ON godevlab_notes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "GoDevLab notes can be inserted by author" ON godevlab_notes;
CREATE POLICY "GoDevLab notes can be inserted by author"
  ON godevlab_notes FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "GoDevLab notes can be updated by author or admin" ON godevlab_notes;
CREATE POLICY "GoDevLab notes can be updated by author or admin"
  ON godevlab_notes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab notes can be deleted by author or admin" ON godevlab_notes;
CREATE POLICY "GoDevLab notes can be deleted by author or admin"
  ON godevlab_notes FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab projects are visible to authenticated users" ON godevlab_projects;
CREATE POLICY "GoDevLab projects are visible to authenticated users"
  ON godevlab_projects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "GoDevLab projects can be inserted by author" ON godevlab_projects;
CREATE POLICY "GoDevLab projects can be inserted by author"
  ON godevlab_projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "GoDevLab projects can be updated by author or admin" ON godevlab_projects;
CREATE POLICY "GoDevLab projects can be updated by author or admin"
  ON godevlab_projects FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab projects can be deleted by author or admin" ON godevlab_projects;
CREATE POLICY "GoDevLab projects can be deleted by author or admin"
  ON godevlab_projects FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab tasks are visible to authenticated users" ON godevlab_project_tasks;
CREATE POLICY "GoDevLab tasks are visible to authenticated users"
  ON godevlab_project_tasks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "GoDevLab tasks can be inserted by author" ON godevlab_project_tasks;
CREATE POLICY "GoDevLab tasks can be inserted by author"
  ON godevlab_project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "GoDevLab tasks can be updated by author or admin" ON godevlab_project_tasks;
CREATE POLICY "GoDevLab tasks can be updated by author or admin"
  ON godevlab_project_tasks FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab tasks can be deleted by author or admin" ON godevlab_project_tasks;
CREATE POLICY "GoDevLab tasks can be deleted by author or admin"
  ON godevlab_project_tasks FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab updates are visible to authenticated users" ON godevlab_project_updates;
CREATE POLICY "GoDevLab updates are visible to authenticated users"
  ON godevlab_project_updates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "GoDevLab updates can be inserted by author" ON godevlab_project_updates;
CREATE POLICY "GoDevLab updates can be inserted by author"
  ON godevlab_project_updates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "GoDevLab updates can be updated by author or admin" ON godevlab_project_updates;
CREATE POLICY "GoDevLab updates can be updated by author or admin"
  ON godevlab_project_updates FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "GoDevLab updates can be deleted by author or admin" ON godevlab_project_updates;
CREATE POLICY "GoDevLab updates can be deleted by author or admin"
  ON godevlab_project_updates FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );
