CREATE TABLE IF NOT EXISTS public.reusable_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.scholarship_applications (id) ON DELETE CASCADE,
  source_question_id uuid NOT NULL REFERENCES public.application_questions (id) ON DELETE CASCADE,
  prompt text NOT NULL,
  content text NOT NULL,
  grounding_keys text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT reusable_answers_source_question_unique UNIQUE (source_question_id)
);

CREATE INDEX IF NOT EXISTS reusable_answers_user_idx
  ON public.reusable_answers (user_id, updated_at DESC);

ALTER TABLE public.reusable_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reusable_answers_select_own"
  ON public.reusable_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reusable_answers_insert_own"
  ON public.reusable_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reusable_answers_update_own"
  ON public.reusable_answers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reusable_answers_delete_own"
  ON public.reusable_answers
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_reusable_answers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reusable_answers_updated_at ON public.reusable_answers;

CREATE TRIGGER reusable_answers_updated_at
  BEFORE UPDATE ON public.reusable_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reusable_answers_updated_at();
