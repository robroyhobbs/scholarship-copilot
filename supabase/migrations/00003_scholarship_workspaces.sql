CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  sponsor_name text,
  source_type text NOT NULL DEFAULT 'paste',
  source_asset_id uuid REFERENCES public.student_assets(id) ON DELETE SET NULL,
  source_text text,
  extraction_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scholarships_source_type_check CHECK (
    source_type IN ('paste', 'asset')
  ),
  CONSTRAINT scholarships_extraction_status_check CHECK (
    extraction_status IN ('pending', 'completed', 'failed')
  )
);

CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_applications_status_check CHECK (
    status IN ('draft', 'in_review', 'ready')
  )
);

CREATE INDEX IF NOT EXISTS scholarships_user_created_idx
  ON public.scholarships (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS scholarship_applications_user_created_idx
  ON public.scholarship_applications (user_id, created_at DESC);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scholarships_select_own"
  ON public.scholarships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "scholarships_insert_own"
  ON public.scholarships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scholarships_update_own"
  ON public.scholarships
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scholarship_applications_select_own"
  ON public.scholarship_applications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "scholarship_applications_insert_own"
  ON public.scholarship_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scholarship_applications_update_own"
  ON public.scholarship_applications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_scholarships_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scholarships_updated_at ON public.scholarships;

CREATE TRIGGER scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scholarships_updated_at();

CREATE OR REPLACE FUNCTION public.update_scholarship_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS scholarship_applications_updated_at ON public.scholarship_applications;

CREATE TRIGGER scholarship_applications_updated_at
  BEFORE UPDATE ON public.scholarship_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scholarship_applications_updated_at();
