import type { JobStatus } from './detectraApi';
import { listMyJobs } from './detectraApi';
import type { VideoUpload } from './supabaseDb';
import { getUserVideoUploads, videoUrlToJobId } from './supabaseDb';
import { isSupabaseConfigured } from './supabase';
import { filterJobsForUser } from './userJobAccess';
import { jobProcessingSeconds, normalizeJobStatusFromDb } from './jobDisplay';

function uploadToSyntheticJob(u: VideoUpload, userId: string): JobStatus | null {
  const jobId = videoUrlToJobId(u.video_url);
  if (!jobId) return null;

  const hasResult = Boolean(u.analysis_results);
  const status = normalizeJobStatusFromDb(u.status, hasResult);
  const failed = status === 'failed';
  const completed = status === 'completed';

  const base: JobStatus = {
    job_id: jobId,
    video_name: u.title || u.artifacts?.video_name || 'Untitled',
    user_id: userId,
    status,
    progress: completed ? 100 : failed ? 0 : hasResult ? 100 : 0,
    stage: failed ? 'failed' : completed ? 'completed' : 'processing',
    created_at: u.created_at,
    started_at: u.created_at,
    completed_at: completed || failed ? u.updated_at : null,
    error: failed ? 'Stored as failed in your account' : null,
    processing_s: 0,
    has_result: hasResult,
    has_report: Boolean(u.artifacts?.report_url || u.artifacts?.has_report),
    has_video: Boolean(
      u.artifacts?.labeled_video_api_url ||
        u.artifacts?.labeled_video_public_url ||
        u.artifacts?.has_video,
    ),
  };

  base.processing_s = jobProcessingSeconds(base, u);
  if (completed && base.progress < 100) base.progress = 100;
  return base;
}

function mergeJobRows(api: JobStatus, fromDb: JobStatus): JobStatus {
  const apiDone = api.status === 'completed' || api.has_result || api.progress >= 100;
  const dbDone = fromDb.has_result;

  let status = api.status;
  if (apiDone || dbDone) status = 'completed';
  else if (api.status === 'running' || fromDb.status === 'running') status = 'running';
  else if (api.status === 'pending' || fromDb.status === 'pending') status = 'pending';
  else if (fromDb.status === 'failed' || api.status === 'failed') status = 'failed';

  const processing_s =
    api.processing_s > 0 ? api.processing_s : fromDb.processing_s > 0 ? fromDb.processing_s : 0;

  return {
    ...fromDb,
    ...api,
    video_name: api.video_name || fromDb.video_name,
    status,
    progress: status === 'completed' ? 100 : Math.max(api.progress ?? 0, fromDb.progress ?? 0),
    processing_s,
    has_result: api.has_result || fromDb.has_result,
    has_report: api.has_report || fromDb.has_report,
    has_video: api.has_video || fromDb.has_video,
    created_at: api.created_at || fromDb.created_at,
    completed_at: api.completed_at || fromDb.completed_at,
    started_at: api.started_at || fromDb.started_at,
    error: api.error ?? fromDb.error,
  };
}

/** Merge in-memory API jobs with Supabase `video_uploads` so history survives API restarts. */
export function mergeJobsFromApiAndDatabase(
  apiJobs: JobStatus[],
  uploads: VideoUpload[],
  userId: string,
): JobStatus[] {
  const byId = new Map<string, JobStatus>();

  for (const u of uploads) {
    const syn = uploadToSyntheticJob(u, userId);
    if (syn) byId.set(syn.job_id, syn);
  }

  for (const j of filterJobsForUser(apiJobs, userId)) {
    const existing = byId.get(j.job_id);
    if (!existing) {
      byId.set(j.job_id, j);
      continue;
    }
    byId.set(j.job_id, mergeJobRows(j, existing));
  }

  const uploadMap = uploadsByJobId(uploads);

  return Array.from(byId.values())
    .map((job) => {
      const upload = uploadMap.get(job.job_id);
      const processing_s = jobProcessingSeconds(job, upload);
      const done = job.has_result || Boolean(upload?.analysis_results);
      const status = done ? 'completed' : job.status;
      return {
        ...job,
        status,
        progress: status === 'completed' ? 100 : job.progress ?? 0,
        processing_s,
        has_result: job.has_result || Boolean(upload?.analysis_results),
      };
    })
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export function jobsFromUploadsOnly(uploads: VideoUpload[], userId: string): JobStatus[] {
  const list: JobStatus[] = [];
  for (const u of uploads) {
    const syn = uploadToSyntheticJob(u, userId);
    if (syn) list.push(syn);
  }
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Load merged job history for a signed-in user (API + Supabase), strictly scoped. */
export async function loadSecureUserJobHistory(userId: string): Promise<JobStatus[]> {
  if (!userId) return [];

  if (isSupabaseConfigured) {
    try {
      const [apiJobs, uploads] = await Promise.all([
        listMyJobs(userId),
        getUserVideoUploads(userId).catch(() => []),
      ]);
      return mergeJobsFromApiAndDatabase(apiJobs, uploads, userId);
    } catch {
      try {
        const uploads = await getUserVideoUploads(userId);
        return jobsFromUploadsOnly(uploads, userId);
      } catch {
        return [];
      }
    }
  }

  const apiJobs = await listMyJobs(userId).catch(() => []);
  return filterJobsForUser(apiJobs, userId);
}

/** Map job_id → Supabase row for display helpers. */
export function uploadsByJobId(uploads: VideoUpload[]): Map<string, VideoUpload> {
  const map = new Map<string, VideoUpload>();
  for (const u of uploads) {
    const id = videoUrlToJobId(u.video_url);
    if (id) map.set(id, u);
  }
  return map;
}
