/*
  Persist API artifact URLs and optional Supabase Storage paths per analysis job.
*/
ALTER TABLE public.video_uploads
  ADD COLUMN IF NOT EXISTS artifacts jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS video_uploads_artifacts_gin_idx
  ON public.video_uploads USING gin (artifacts);
