-- GoGevgelija New Update planner schema
-- Run this after the base employees schema.

CREATE TABLE IF NOT EXISTS gogevgelija_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT,
  target_date DATE,
  summary TEXT,
  created_by UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gogevgelija_update_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES gogevgelija_updates(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gogevgelija_update_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES gogevgelija_updates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gogevgelija_update_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID NOT NULL REFERENCES gogevgelija_updates(id) ON DELETE CASCADE,
  lane TEXT NOT NULL CHECK (lane IN ('next-patch', 'minor-release', 'future-lab')),
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gogevgelija_updates_updated_at
  ON gogevgelija_updates(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_gogevgelija_update_photos_update
  ON gogevgelija_update_photos(update_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_gogevgelija_update_highlights_update
  ON gogevgelija_update_highlights(update_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_gogevgelija_update_ideas_update
  ON gogevgelija_update_ideas(update_id, lane, sort_order);

CREATE OR REPLACE FUNCTION set_gogevgelija_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gogevgelija_updates_updated_at ON gogevgelija_updates;
CREATE TRIGGER trg_gogevgelija_updates_updated_at
  BEFORE UPDATE ON gogevgelija_updates
  FOR EACH ROW
  EXECUTE FUNCTION set_gogevgelija_update_updated_at();

ALTER TABLE gogevgelija_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gogevgelija_update_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gogevgelija_update_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE gogevgelija_update_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view GoGevgelija updates" ON gogevgelija_updates;
CREATE POLICY "Authenticated users can view GoGevgelija updates"
  ON gogevgelija_updates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Editors can create GoGevgelija updates" ON gogevgelija_updates;
CREATE POLICY "Editors can create GoGevgelija updates"
  ON gogevgelija_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update GoGevgelija updates" ON gogevgelija_updates;
CREATE POLICY "Editors can update GoGevgelija updates"
  ON gogevgelija_updates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can delete GoGevgelija updates" ON gogevgelija_updates;
CREATE POLICY "Editors can delete GoGevgelija updates"
  ON gogevgelija_updates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view GoGevgelija update photos" ON gogevgelija_update_photos;
CREATE POLICY "Authenticated users can view GoGevgelija update photos"
  ON gogevgelija_update_photos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Editors can manage GoGevgelija update photos" ON gogevgelija_update_photos;
CREATE POLICY "Editors can manage GoGevgelija update photos"
  ON gogevgelija_update_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view GoGevgelija update highlights" ON gogevgelija_update_highlights;
CREATE POLICY "Authenticated users can view GoGevgelija update highlights"
  ON gogevgelija_update_highlights FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Editors can manage GoGevgelija update highlights" ON gogevgelija_update_highlights;
CREATE POLICY "Editors can manage GoGevgelija update highlights"
  ON gogevgelija_update_highlights FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view GoGevgelija update ideas" ON gogevgelija_update_ideas;
CREATE POLICY "Authenticated users can view GoGevgelija update ideas"
  ON gogevgelija_update_ideas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Editors can manage GoGevgelija update ideas" ON gogevgelija_update_ideas;
CREATE POLICY "Editors can manage GoGevgelija update ideas"
  ON gogevgelija_update_ideas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('gogevgelija-update-photos', 'gogevgelija-update-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can read GoGevgelija update storage" ON storage.objects;
CREATE POLICY "Authenticated users can read GoGevgelija update storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'gogevgelija-update-photos');

DROP POLICY IF EXISTS "Editors can upload GoGevgelija update storage" ON storage.objects;
CREATE POLICY "Editors can upload GoGevgelija update storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gogevgelija-update-photos'
    AND EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update GoGevgelija update storage" ON storage.objects;
CREATE POLICY "Editors can update GoGevgelija update storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gogevgelija-update-photos'
    AND EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    bucket_id = 'gogevgelija-update-photos'
    AND EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can delete GoGevgelija update storage" ON storage.objects;
CREATE POLICY "Editors can delete GoGevgelija update storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gogevgelija-update-photos'
    AND EXISTS (
      SELECT 1
      FROM employees
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
