-- ============================================================
-- Run in TEACHERS Supabase project: SQL Editor → New query
-- ============================================================
-- Adds price_per_student to the teachers table and allows the
-- dashboard (anon) to update it so the total revenue updates.

-- 1) Add column for price per student (default 20)
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS price_per_student NUMERIC DEFAULT 20;

-- 2) Allow anon to update teachers (so the dashboard can save price)
DROP POLICY IF EXISTS "Allow anon update teachers price" ON public.teachers;
CREATE POLICY "Allow anon update teachers price"
  ON public.teachers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- After this, the dashboard will save and load price from Supabase.
