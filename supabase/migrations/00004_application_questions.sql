ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS extracted_deadline date;

CREATE TABLE IF NOT EXISTS public.application_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  question_type text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT application_questions_type_check CHECK (
    question_type IN ('essay', 'short_answer', 'attachment')
  )
);

CREATE INDEX IF NOT EXISTS application_questions_application_order_idx
  ON public.application_questions (application_id, order_index);

ALTER TABLE public.application_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_questions_select_own"
  ON public.application_questions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "application_questions_insert_own"
  ON public.application_questions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_questions_update_own"
  ON public.application_questions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "application_questions_delete_own"
  ON public.application_questions
  FOR DELETE
  USING (auth.uid() = user_id);
