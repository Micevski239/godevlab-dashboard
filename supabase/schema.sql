-- Employees table (linked to Supabase auth.users)
CREATE TABLE employees (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'worker')) DEFAULT 'worker',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Time entries for clock in/out
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast employee lookups
CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_clock_in ON time_entries(clock_in DESC);

-- RLS: employees can read all employees, only admins can modify
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own employee record"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
  );

CREATE POLICY "Admins can insert any employee"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: users can manage own time entries, admins can see all
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  TO authenticated
  USING (
    employee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all notes"
  ON notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own notes or admins can delete any"
  ON notes FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role = 'admin')
  );
