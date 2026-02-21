-- ============================================================
-- Run in TEACHERS Supabase project: SQL Editor → New query
-- ============================================================
-- Your teachers table only allows authenticated users to read their OWN row.
-- The STEMify Admin Dashboard uses the anon key, so it sees no teachers.
-- Add this policy so the dashboard can list all teachers (read-only).

-- Allow anon to SELECT all rows in teachers (for admin dashboard only)
DROP POLICY IF EXISTS "Allow anon read teachers" ON public.teachers;
CREATE POLICY "Allow anon read teachers"
  ON public.teachers
  FOR SELECT
  TO anon
  USING (true);

-- You already have anon read for teacher_month_students and teacher_month_content.
-- No change needed for those. After running this, refresh the Teachers page.
