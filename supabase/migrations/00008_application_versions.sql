CREATE TABLE IF NOT EXISTS public.application_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.scholarship_applications (id) ON DELETE CASCADE,
  ready_to_submit boolean NOT NULL DEFAULT false,
  section_count integer NOT NULL DEFAULT 0,
  packet jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS application_versions_application_idx
  ON public.application_versions (application_id, created_at DESC);

ALTER TABLE public.application_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_versions_select_own"
  ON public.application_versions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "application_versions_insert_own"
  ON public.application_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_versions_delete_own"
  ON public.application_versions
  FOR DELETE USING (auth.uid() = user_id);
