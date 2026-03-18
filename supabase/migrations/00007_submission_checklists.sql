CREATE TABLE IF NOT EXISTS public.submission_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.scholarship_applications (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.application_questions (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT submission_checklists_question_unique UNIQUE (question_id),
  CONSTRAINT submission_checklists_status_check CHECK (status IN ('ready'))
);

CREATE INDEX IF NOT EXISTS submission_checklists_application_idx
  ON public.submission_checklists (application_id, updated_at DESC);

ALTER TABLE public.submission_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submission_checklists_select_own"
  ON public.submission_checklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "submission_checklists_insert_own"
  ON public.submission_checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "submission_checklists_update_own"
  ON public.submission_checklists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "submission_checklists_delete_own"
  ON public.submission_checklists
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_submission_checklists_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submission_checklists_updated_at ON public.submission_checklists;

CREATE TRIGGER submission_checklists_updated_at
  BEFORE UPDATE ON public.submission_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_submission_checklists_updated_at();
