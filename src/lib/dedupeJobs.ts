import type { JobStatus } from './detectraApi';

function jobScore(j: JobStatus): number {
  let s = 0;
  if (j.status === 'completed') s += 1000;
  else if (j.status === 'running') s += 500;
  else if (j.status === 'pending') s += 200;
  s += j.progress ?? 0;
  const t = j.completed_at || j.started_at || j.created_at || '';
  return s + (t ? new Date(t).getTime() / 1e15 : 0);
}

/** One row per video name — keeps the best / latest analysis when duplicates exist. */
export function dedupeJobsByVideo(list: JobStatus[]): JobStatus[] {
  const byVideo = new Map<string, JobStatus>();
  for (const job of list) {
    const key = (job.video_name || job.job_id).trim().toLowerCase();
    const cur = byVideo.get(key);
    if (!cur || jobScore(job) > jobScore(cur)) {
      byVideo.set(key, job);
    }
  }
  return [...byVideo.values()].sort(
    (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
  );
}
