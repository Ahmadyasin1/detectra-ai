import {
  getJobResult,
  getJobStatus,
  getReportUrl,
  getRagJsonUrl,
  getVideoUrl,
  apiUrl,
  fetchWithAuth,
  type AnalysisResult,
  type JobStatus,
} from './detectraApi';
import {
  createVideoUpload,
  getVideoUploadByJobId,
  updateVideoUpload,
  type VideoUploadArtifacts,
} from './supabaseDb';
import { isSupabaseConfigured } from './supabase';

export type PersistJobOptions = {
  /** Download labeled MP4 from API and store in Supabase Storage (best-effort). */
  archiveLabeledVideo?: boolean;
  sourceStoragePath?: string | null;
  sourcePublicUrl?: string | null;
};

/** Save analysis JSON, artifact URLs, and optional labeled video copy for the signed-in user. */
export async function persistJobToUserLibrary(
  userId: string,
  jobId: string,
  options: PersistJobOptions = {},
): Promise<{ status: JobStatus | null; result: AnalysisResult | null }> {
  if (!userId || !jobId || !isSupabaseConfigured) {
    return { status: null, result: null };
  }

  let status: JobStatus | null = null;
  let result: AnalysisResult | null = null;

  try {
    status = await getJobStatus(jobId);
  } catch (err) {
    console.warn('[persistJob] getJobStatus failed:', err);
    return { status: null, result: null };
  }

  const completed =
    status.status === 'completed' || status.has_result || status.progress >= 100;

  if (completed) {
    try {
      result = await getJobResult(jobId);
    } catch (err) {
      console.warn('[persistJob] getJobResult failed:', err);
    }
  }

  const existing = await getVideoUploadByJobId(userId, jobId);
  if (!existing) {
    await createVideoUpload(userId, jobId, status.video_name || 'Untitled Analysis');
  }

  const artifacts: VideoUploadArtifacts = {
    report_url: status.has_report ? getReportUrl(jobId) : undefined,
    labeled_video_api_url: status.has_video ? getVideoUrl(jobId) : undefined,
    rag_url: getRagJsonUrl(jobId),
    api_base: apiUrl(''),
    source_storage_path: options.sourceStoragePath ?? undefined,
    source_public_url: options.sourcePublicUrl ?? undefined,
    saved_at: new Date().toISOString(),
    processing_time_s: result?.processing_time_s ?? status.processing_s ?? undefined,
    duration_s: result?.duration_s,
    risk_level: result?.risk_level,
    risk_score: result?.risk_score,
    video_name: status.video_name || result?.video_name,
    has_report: status.has_report,
    has_video: status.has_video,
  };

  if (options.archiveLabeledVideo && status.has_video && completed) {
    try {
      const res = await fetchWithAuth(`/api/jobs/${jobId}/video`);
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], `${jobId}-labeled.mp4`, { type: 'video/mp4' });
        const path = `labeled/${userId}/${jobId}.mp4`;
        const { supabase } = await import('./supabase');
        const bucket =
          (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || 'videos';
        const { error } = await supabase.storage.from(bucket).upload(path, file, {
          upsert: true,
          cacheControl: '3600',
        });
        if (!error) {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          artifacts.labeled_video_storage_path = path;
          artifacts.labeled_video_public_url = data?.publicUrl ?? undefined;
        }
      }
    } catch (err) {
      console.warn('[persistJob] labeled video archive failed:', err);
    }
  }

  await updateVideoUpload(userId, jobId, {
    status: completed ? 'completed' : status.status === 'failed' ? 'failed' : 'processing',
    analysis_results: result,
    title: status.video_name || undefined,
    artifacts,
  });

  return { status, result };
}

/** Backfill Supabase rows missing full analysis JSON (e.g. API-only jobs or failed server sync). */
export async function syncUserJobLibraryToDatabase(
  userId: string,
  jobs: JobStatus[],
): Promise<void> {
  if (!userId || !isSupabaseConfigured) return;

  const uploads = await getVideoUploadsMap(userId);
  const completed = jobs.filter(
    (j) => j.status === 'completed' || j.has_result || j.progress >= 100,
  );

  for (const job of completed.slice(0, 20)) {
    const row = uploads.get(job.job_id);
    const missingResult = !row?.analysis_results;
    const missingMeta = !row?.artifacts?.saved_at;
    if (!missingResult && !missingMeta) continue;

    try {
      await persistJobToUserLibrary(userId, job.job_id, {
        archiveLabeledVideo: Boolean(job.has_video && !row?.artifacts?.labeled_video_public_url),
        sourceStoragePath: row?.artifacts?.source_storage_path ?? null,
        sourcePublicUrl: row?.artifacts?.source_public_url ?? null,
      });
    } catch (err) {
      console.warn(`[syncUserJobLibrary] ${job.job_id}:`, err);
    }
  }
}

async function getVideoUploadsMap(userId: string): Promise<Map<string, import('./supabaseDb').VideoUpload>> {
  const { getUserVideoUploads, videoUrlToJobId } = await import('./supabaseDb');
  const uploads = await getUserVideoUploads(userId).catch(() => []);
  const map = new Map<string, import('./supabaseDb').VideoUpload>();
  for (const u of uploads) {
    const id = videoUrlToJobId(u.video_url);
    if (id) map.set(id, u);
  }
  return map;
}
