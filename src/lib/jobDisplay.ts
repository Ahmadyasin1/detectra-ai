import type { JobStatus } from './detectraApi';
import type { VideoUpload } from './supabaseDb';

/** Resolve processing duration for job library display (API seconds or DB cache). */
export function jobProcessingSeconds(job: JobStatus, upload?: VideoUpload | null): number {
  if (job.processing_s && job.processing_s > 0) return job.processing_s;
  const art = upload?.artifacts;
  if (typeof art?.processing_time_s === 'number' && art.processing_time_s > 0) {
    return art.processing_time_s;
  }
  const ar = upload?.analysis_results;
  if (ar?.processing_time_s && ar.processing_time_s > 0) return ar.processing_time_s;
  return 0;
}

export function jobVideoDurationSeconds(_job: JobStatus, upload?: VideoUpload | null): number {
  const ar = upload?.analysis_results;
  if (ar?.duration_s && ar.duration_s > 0) return ar.duration_s;
  const art = upload?.artifacts;
  if (typeof art?.duration_s === 'number' && art.duration_s > 0) return art.duration_s;
  return 0;
}

export function formatJobTimeLabel(job: JobStatus, upload?: VideoUpload | null): string {
  const proc = jobProcessingSeconds(job, upload);
  if (proc > 0) return `${proc.toFixed(1)}s`;
  const dur = jobVideoDurationSeconds(job, upload);
  if (dur > 0) {
    const m = Math.floor(dur / 60);
    const s = Math.round(dur % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
  if (job.completed_at || upload?.updated_at) {
    const d = new Date(job.completed_at || upload!.updated_at);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return '—';
}

export function normalizeJobStatusFromDb(
  dbStatus: VideoUpload['status'],
  hasResult: boolean,
): JobStatus['status'] {
  if (hasResult) return 'completed';
  if (dbStatus === 'failed') return 'failed';
  if (dbStatus === 'processing') return 'running';
  // Row marked completed in DB but JSON missing — treat as still processing
  if (dbStatus === 'completed') return 'running';
  return 'pending';
}
