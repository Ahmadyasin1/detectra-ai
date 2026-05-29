export const JOB_FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'completed' as const, label: 'Done' },
  { id: 'running' as const, label: 'Running' },
  { id: 'pending' as const, label: 'Queued' },
  { id: 'failed' as const, label: 'Failed' },
] as const;

export type JobFilterId = (typeof JOB_FILTERS)[number]['id'];
