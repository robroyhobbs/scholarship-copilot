CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  school_name text NOT NULL DEFAULT '',
  academic_year text NOT NULL DEFAULT 'freshman',
  intended_major text NOT NULL DEFAULT '',
  career_goal text NOT NULL DEFAULT '',
  gpa text,
  extracurriculars text[] NOT NULL DEFAULT '{}',
  leadership_roles text[] NOT NULL DEFAULT '{}',
  volunteer_work text[] NOT NULL DEFAULT '{}',
  work_experience text[] NOT NULL DEFAULT '{}',
  awards text[] NOT NULL DEFAULT '{}',
  financial_need_context text,
  personal_themes text[] NOT NULL DEFAULT '{}',
  writing_preferences text,
  challenges_adversity text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_profiles_academic_year_check CHECK (
    academic_year IN (
      'high-school-senior',
      'freshman',
      'sophomore',
      'junior',
      'senior',
      'graduate'
    )
  )
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_profiles_select_own"
  ON public.student_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "student_profiles_insert_own"
  ON public.student_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_profiles_update_own"
  ON public.student_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_student_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_profiles_updated_at ON public.student_profiles;

CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_profiles_updated_at();
