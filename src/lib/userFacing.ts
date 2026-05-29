/** Human-readable labels for UI (not API contracts). */

export const JOB_STATUS_LABEL: Record<string, string> = {
  pending: 'Queued',
  running: 'Analyzing',
  completed: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function jobStatusLabel(status: string): string {
  return JOB_STATUS_LABEL[status] ?? status;
}

export const STAGE_FRIENDLY: Record<string, string> = {
  queued:           'Waiting in queue',
  initializing:     'Starting engines',
  loadingyoloseg:   'Loading vision model',
  loadingyolopose:  'Loading pose model',
  modelsready:      'Models ready',
  loadingmodels:    'Loading AI models',
  readingvideo:     'Reading your video',
  startinganalysis: 'Starting analysis',
  perception:       'Detecting people & objects',
  speech:           'Transcribing speech',
  speechaudio:      'Processing speech',
  audio:            'Classifying sounds',
  fusion:           'Fusing video + audio intelligence',
  surveillance:     'Scoring security events',
  postprocessing:   'Validating & correlating events',
  validation:       'Validating results',
  identityreasoning:'AI reasoning & identity analysis',
  writingoutput:    'Computing statistics',
  writingvideo:     'Rendering annotated video',
  writingreport:    'Generating intelligence report',
  writingragjson:   'Saving structured analysis data',
  completed:        'Analysis complete',
  failed:           'Analysis failed',
};

export function friendlyStage(stage: string): string {
  if (!stage) return 'Initializing';
  const key = stage.toLowerCase().replace(/[_\s]/g, '');
  return STAGE_FRIENDLY[key] ?? stage.replace(/_/g, ' ');
}

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

export function validateVideoFile(file: File): string | null {
  if (!file.type.startsWith('video/') && !/\.(mp4|avi|mov|mkv|webm|m4v|flv)$/i.test(file.name)) {
    return 'Please choose a video file (MP4, MOV, AVI, MKV, or WebM).';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File is too large. Maximum size is 500 MB.';
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
