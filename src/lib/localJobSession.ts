/** Browser-local job IDs for guests (no Supabase account). */
const STORAGE_KEY = 'detectra_local_jobs_v1';

export type LocalJobEntry = {
  job_id: string;
  video_name: string;
  created_at: string;
};

function read(): LocalJobEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalJobEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: LocalJobEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

export function addLocalJob(jobId: string, videoName: string) {
  if (!jobId) return;
  const list = read().filter((e) => e.job_id !== jobId);
  list.unshift({
    job_id: jobId,
    video_name: videoName || 'Untitled',
    created_at: new Date().toISOString(),
  });
  write(list);
}

export function removeLocalJob(jobId: string) {
  write(read().filter((e) => e.job_id !== jobId));
}

export function getLocalJobs(): LocalJobEntry[] {
  return read();
}
