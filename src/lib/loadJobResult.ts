import { getJobResult, getJobStatus, type AnalysisResult } from './detectraApi';
import { getVideoUploadByJobId } from './supabaseDb';
import { isSupabaseConfigured } from './supabase';
import { persistJobToUserLibrary } from './jobPersistence';

export function jobIsViewable(
  status?: string,
  hasResult?: boolean,
  progress?: number,
): boolean {
  return status === 'completed' || Boolean(hasResult) || (progress ?? 0) >= 100;
}

/** Load analysis JSON from Supabase cache and/or API (handles 409 / ephemeral API). */
export async function loadJobAnalysisResult(
  jobId: string,
  userId?: string | null,
): Promise<AnalysisResult> {
  if (userId && isSupabaseConfigured) {
    const cached = await getVideoUploadByJobId(userId, jobId).catch(() => null);
    if (cached?.analysis_results) return cached.analysis_results;
  }

  try {
    const result = await getJobResult(jobId);
    if (userId && isSupabaseConfigured) {
      void persistJobToUserLibrary(userId, jobId, { archiveLabeledVideo: true });
    }
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const incomplete = msg.toLowerCase().includes('not completed');

    if (userId && isSupabaseConfigured) {
      const cached = await getVideoUploadByJobId(userId, jobId).catch(() => null);
      if (cached?.analysis_results) return cached.analysis_results;
    }

    if (incomplete) {
      const status = await getJobStatus(jobId).catch(() => null);
      if (status && jobIsViewable(status.status, status.has_result, status.progress)) {
        try {
          const result = await getJobResult(jobId);
          if (userId && isSupabaseConfigured) {
            void persistJobToUserLibrary(userId, jobId, { archiveLabeledVideo: true });
          }
          return result;
        } catch {
          /* fall through */
        }
      }
    }

    throw err;
  }
}
