-- One analysis row per user per job (secure multi-tenant history).
CREATE UNIQUE INDEX IF NOT EXISTS video_uploads_user_job_uidx
  ON public.video_uploads (user_id, video_url);
