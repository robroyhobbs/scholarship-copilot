CREATE TABLE IF NOT EXISTS public.draft_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.application_questions(id) ON DELETE CASCADE,
  content text NOT NULL,
  grounding_keys text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'generated',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT draft_responses_status_check CHECK (
    status IN ('generated', 'edited')
  ),
  CONSTRAINT draft_responses_question_unique UNIQUE (question_id)
);

CREATE INDEX IF NOT EXISTS draft_responses_application_idx
  ON public.draft_responses (application_id, created_at DESC);

ALTER TABLE public.draft_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "draft_responses_select_own"
  ON public.draft_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "draft_responses_insert_own"
  ON public.draft_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "draft_responses_update_own"
  ON public.draft_responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "draft_responses_delete_own"
  ON public.draft_responses
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_draft_responses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS draft_responses_updated_at ON public.draft_responses;

CREATE TRIGGER draft_responses_updated_at
  BEFORE UPDATE ON public.draft_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_draft_responses_updated_at();
