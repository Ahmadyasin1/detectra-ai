import type { JobStatus } from './detectraApi';
import { getJobStatus } from './detectraApi';
import { getVideoUploadByJobId } from './supabaseDb';
import { isSupabaseConfigured } from './supabase';
import { getLocalJobs } from './localJobSession';

/** Strict: only rows explicitly owned by this user (no anonymous / unassigned leak). */
export function filterJobsForUser(jobs: JobStatus[], userId: string): JobStatus[] {
  if (!userId) return [];
  return jobs.filter((j) => j.user_id === userId);
}

export function userOwnsJob(job: Pick<JobStatus, 'user_id'> | null | undefined, userId: string): boolean {
  return Boolean(userId && job?.user_id === userId);
}

/** True if this job exists in the user's Supabase library. */
export async function userHasStoredJob(userId: string, jobId: string): Promise<boolean> {
  if (!userId || !jobId || !isSupabaseConfigured) return false;
  const row = await getVideoUploadByJobId(userId, jobId).catch(() => null);
  return Boolean(row);
}

/**
 * Whether the signed-in user may open this job (API ownership or Supabase row).
 */
export async function userCanAccessJob(userId: string, jobId: string): Promise<boolean> {
  if (!userId || !jobId) return false;

  if (await userHasStoredJob(userId, jobId)) return true;

  try {
    const status = await getJobStatus(jobId);
    if (status.user_id === userId) return true;
    if (status.user_id === 'anonymous' && getLocalJobs().some((e) => e.job_id === jobId)) {
      return true;
    }
    return false;
  } catch {
    return getLocalJobs().some((e) => e.job_id === jobId);
  }
}
