import { Database, Search, ExternalLink, Trash2, RotateCw, Film } from 'lucide-react';
import type { JobStatus } from '../../lib/detectraApi';
import { formatJobTimeLabel } from '../../lib/jobDisplay';
import type { VideoUpload } from '../../lib/supabaseDb';
import { jobStatusLabel } from '../../lib/userFacing';
import EmptyState from '../ui/EmptyState';
import { JobFilterPills, type JobFilterId } from './AnalyzerUI';

function statusTone(status: string) {
  if (status === 'completed') return 'analyzer-job-status--done';
  if (status === 'failed') return 'analyzer-job-status--failed';
  if (status === 'running') return 'analyzer-job-status--running';
  if (status === 'pending') return 'analyzer-job-status--queued';
  return 'analyzer-job-status--default';
}

export type JobLibraryPanelProps = {
  jobs: JobStatus[];
  filteredJobs: JobStatus[];
  uploadsByJob?: Map<string, VideoUpload>;
  jobQuery: string;
  onJobQueryChange: (q: string) => void;
  jobFilter: JobFilterId;
  onJobFilterChange: (f: JobFilterId) => void;
  currentJobId: string | null;
  runningCount: number;
  onRefresh: () => void;
  onOpen: (jobId: string, status?: string, hasResult?: boolean, progress?: number) => void;
  onPreview: (jobId: string) => void;
  onDelete: (jobId: string) => void;
};

export default function JobLibraryPanel({
  jobs,
  filteredJobs,
  uploadsByJob,
  jobQuery,
  onJobQueryChange,
  jobFilter,
  onJobFilterChange,
  currentJobId,
  runningCount,
  onRefresh,
  onOpen,
  onPreview,
  onDelete,
}: JobLibraryPanelProps) {
  return (
    <section className="analyzer-job-library-panel">
      <div className="analyzer-job-library-head">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-cyan-400/90" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-200">Job library</h2>
          {runningCount > 0 && (
            <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">
              {runningCount} active
            </span>
          )}
        </div>
        <button type="button" onClick={onRefresh} className="analyzer-btn-ghost min-h-[36px] px-3 text-xs gap-1.5">
          <RotateCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="analyzer-job-library-toolbar">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={jobQuery}
            onChange={(e) => onJobQueryChange(e.target.value)}
            placeholder="Search videos..."
            className="analyzer-job-search w-full"
          />
        </div>
        <JobFilterPills value={jobFilter} onChange={onJobFilterChange} />
        <p className="text-xs text-gray-500 tabular-nums shrink-0">
          <span className="font-medium text-gray-300">{filteredJobs.length}</span> of {jobs.length}
        </p>
      </div>

      {!filteredJobs.length ? (
        <EmptyState
          icon={Database}
          title={jobs.length ? 'No matches' : 'No analyses yet'}
          description={jobs.length ? 'Try another filter or search.' : 'Upload a video to start.'}
        />
      ) : (
        <>
          <div className="analyzer-job-table-wrap hidden md:block">
            <table className="analyzer-job-table">
              <thead>
                <tr>
                  <th className="w-[40%]">Video</th>
                  <th>Status</th>
                  <th className="w-[22%]">Progress</th>
                  <th className="text-right w-[5rem]">Time</th>
                  <th className="text-right w-[7rem]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => {
                  const active = j.job_id === currentJobId;
                  const upload = uploadsByJob?.get(j.job_id);
                  const timeLabel = formatJobTimeLabel(j, upload);
                  const pct = j.status === 'completed' ? 100 : j.progress ?? 0;
                  return (
                    <tr
                      key={j.job_id}
                      className={`analyzer-job-row ${active ? 'analyzer-job-row--active' : ''}`}
                      onClick={() => onPreview(j.job_id)}
                    >
                      <td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Film className="h-4 w-4 shrink-0 text-cyan-400/80" aria-hidden />
                          <span className="truncate text-sm text-gray-100" title={j.video_name}>
                            {j.video_name || 'Untitled'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`analyzer-job-status ${statusTone(j.status)}`}>
                          {jobStatusLabel(j.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="analyzer-mono text-[11px] text-gray-500 w-7">{pct}%</span>
                        </div>
                      </td>
                      <td className="text-right analyzer-mono text-xs text-gray-500" title="Processing time">
                        {timeLabel}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpen(j.job_id, j.status, j.has_result, j.progress)}
                            className="analyzer-btn-accent min-h-[34px] px-2.5 text-xs gap-1"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(j.job_id)}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/15 min-h-[34px] min-w-[34px]"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 md:hidden">
            {filteredJobs.map((j) => {
              const active = j.job_id === currentJobId;
              const upload = uploadsByJob?.get(j.job_id);
              const timeLabel = formatJobTimeLabel(j, upload);
              const pct = j.status === 'completed' ? 100 : j.progress ?? 0;
              return (
                <article
                  key={j.job_id}
                  className={`analyzer-job-card ${active ? 'analyzer-job-card--active' : ''}`}
                  onClick={() => onPreview(j.job_id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-100 truncate">{j.video_name}</p>
                    <span className={`analyzer-job-status shrink-0 ${statusTone(j.status)}`}>
                      {jobStatusLabel(j.status)}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-cyan-500/80" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="analyzer-mono text-[10px] text-gray-500">{timeLabel}</span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => onOpen(j.job_id, j.status, j.has_result, j.progress)} className="analyzer-btn-accent flex-1 text-xs">
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(j.job_id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
