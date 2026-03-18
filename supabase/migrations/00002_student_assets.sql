CREATE TABLE IF NOT EXISTS public.student_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  asset_kind text NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  processing_status text NOT NULL DEFAULT 'pending',
  extracted_text text,
  parsed_text_preview text,
  chunk_count integer NOT NULL DEFAULT 0,
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_assets_asset_kind_check CHECK (
    asset_kind IN (
      'resume',
      'transcript',
      'essay',
      'award',
      'activity-sheet',
      'reference-note',
      'scholarship-form',
      'other'
    )
  ),
  CONSTRAINT student_assets_file_type_check CHECK (
    file_type IN ('pdf', 'docx', 'txt', 'md')
  ),
  CONSTRAINT student_assets_processing_status_check CHECK (
    processing_status IN ('pending', 'completed', 'failed')
  )
);

CREATE TABLE IF NOT EXISTS public.student_asset_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.student_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  chunk_index integer NOT NULL,
  token_count integer NOT NULL,
  section_heading text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_assets_user_created_idx
  ON public.student_assets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_asset_chunks_asset_idx
  ON public.student_asset_chunks (asset_id, chunk_index);

ALTER TABLE public.student_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_asset_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_assets_select_own"
  ON public.student_assets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "student_assets_insert_own"
  ON public.student_assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_assets_update_own"
  ON public.student_assets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "student_asset_chunks_select_own"
  ON public.student_asset_chunks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "student_asset_chunks_insert_own"
  ON public.student_asset_chunks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_student_assets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_assets_updated_at ON public.student_assets;

CREATE TRIGGER student_assets_updated_at
  BEFORE UPDATE ON public.student_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_assets_updated_at();
