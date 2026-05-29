import { supabase, isSupabaseConfigured } from './supabase';

/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Enums / Literals ---------------------------------------------------------

export type JobStatusValue =
  | 'pending'    // just submitted, waiting for worker
  | 'running'    // actively being processed
  | 'completed'  // finished successfully
  | 'failed'     // error occurred
  | 'cancelled'; // user cancelled

export type Severity   = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel  = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// --- Backend data shapes (match analyze_videos.py dataclasses) ----------------

export interface SurveillanceEvent {
  timestamp_s:  number;
  event_type:   string;   // fall | fight | loitering | crowd_surge | intrusion | ...
  severity:     Severity;
  description:  string;
  confidence:   number;   // 0-1
  track_ids:    number[];
}

export interface FusionInsight {
  window_start_s:         number;
  window_end_s:           number;
  scene_label:            string;
  anomaly_score:          number;   // 0-1
  visual_audio_alignment: number;   // 0-1
  confidence:             number;
  alert:                  boolean;
  severity:               Severity;
  contributing_factors:   string[];
  description:            string;
}

export interface SpeechSegment {
  start_s:       number;
  end_s:         number;
  text:          string;
  language:      string;   // ISO code e.g. "en"
  language_name: string;
  confidence:    number;
  is_noise:      boolean;
}

export interface AudioEvent {
  timestamp_s: number;
  event_type:  string;   // speech | scream | gunshot | siren | music | ...
  details:     string;
  confidence:  number;
}

export interface DetectedLanguage {
  code:          string;
  name:          string;
  confidence:    number;
  segment_count: number;
}

export interface TopObject {
  label: string;
  count: number;
}

/** Downsampled per-frame stats (from full `frame_results` on the server). */
export interface FrameAnalyticsPoint {
  t: number;
  person_count: number;
  action: string;
  motion: number;
}

export interface SeverityCounts {
  critical: number;
  high:     number;
  medium:   number;
  low:      number;
}

export interface AnalysisResult {
  // Video metadata
  video_name:             string;   // computed by backend: video_path stem
  duration_s:             number;
  width:                  number;
  height:                 number;
  fps:                    number;
  total_frames:           number;

  // Detection results
  surveillance_events:    SurveillanceEvent[];
  fusion_insights:        FusionInsight[];
  speech_segments:        SpeechSegment[];
  audio_events:           AudioEvent[];
  unique_track_ids:       number[];
  /** Co-occurrence estimate — collapses ByteTrack ID-switch fragments (see backend). */
  distinct_individuals?:   number;
  total_object_count:     number;
  class_frequencies:      Record<string, number>;
  action_frequencies:     Record<string, number>;
  max_persons_in_frame:   number;
  max_concurrent_persons: number;
  peak_activity_ts:       number;
  full_transcript:        string;
  detected_languages:     DetectedLanguage[];
  summary:                string;
  processing_time_s:      number;

  // v7.1 fields (crowd intelligence & identity)
  crowd_density_score?:   number;     // 0–1 crowding score for the video
  model_recommendation?:  string;     // suggested upgrade model for this scene type
  face_count_peak?:       number;     // highest simultaneous face count in any frame
  face_detections?:       FaceDetection[];

  // Computed by _serialize_analysis
  risk_level:         RiskLevel;
  risk_score:         number;         // 0-1 weighted severity score
  anomaly_timeline:   number[];       // per-second anomaly scores (index = second)
  severity_counts:    SeverityCounts;
  top_objects:        TopObject[];
  /** Present when the API serializes analysis with per-frame telemetry. */
  frame_analytics?:   FrameAnalyticsPoint[];
}

export interface FaceDetection {
  timestamp_s:  number;
  face_count:   number;
  embeddings?:  number[][];   // optional face embeddings (rarely sent)
}

// --- Job status ---------------------------------------------------------------

export interface JobStatus {
  job_id:       string;
  video_name:   string;
  user_id:      string;
  status:       JobStatusValue;
  progress:     number;           // 0-100
  stage:        string;
  created_at:   string;
  started_at:   string | null;
  completed_at: string | null;
  error:        string | null;
  processing_s: number;
  has_result:   boolean;
  has_report:   boolean;
  has_video:    boolean;
}

export interface SubmitResponse {
  job_id:         string;
  status:         string;
  video_name:     string;
  user_id:        string;
  size_mb:        number;
  queue_position: number;
  ws_url:         string;
  status_url:     string;
  result_url?:    string;
}

export interface ApiHealth {
  status:              string;
  version:             string;
  timestamp:           string;
  models_loaded:       boolean;
  running_jobs:        number;
  queued_jobs:         number;
  total_jobs:          number;
  max_concurrent:      number;
  supabase_configured?: boolean;
  on_heroku?:          boolean;
  multiagent_enabled?: boolean;
  opencv?:             string;
  uptime_s?:           number;
  models?: {
    yolo_seg?:       string;
    yolo_pose?:      string;
    whisper?:        string;
    faster_whisper?: boolean;
  };
}

export interface ApiStats {
  total: number;
  completed: number;
  active: number;
  failed: number;
  critical_alerts: number;
  uptime_s: number;
}

export interface TranscriptTranslationResponse {
  job_id: string;
  target_lang: string;
  translated_text: string;
  message?: string;
}

export interface JobAskResponse {
  answer: string;
}

// --- HTTP client --------------------------------------------------------------

/**
 * Explicit backend URL, set via VITE_API_URL at build time.
 * In production on Vercel, leave VITE_API_URL empty — vercel.json rewrites
 * proxy /api/* and /health to the DigitalOcean backend transparently.
 * Set VITE_API_URL to a full URL only when deploying without Vercel rewrites
 * (e.g. a custom domain with HTTPS on the DO droplet).
 */
const CONFIGURED_API = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') || ''
);

/**
 * HTTP base URL for REST calls.
 * - Dev: '' → Vite proxies /api and /health to VITE_API_URL (see vite.config.ts).
 * - Prod on Vercel: '' → vercel.json rewrites proxy to DO backend (no CORS, no mixed content).
 * - Direct (VITE_API_DIRECT=true): uses VITE_API_URL (requires HTTPS on DO + ALLOWED_ORIGINS).
 */
export const API_URL: string = (() => {
  if (import.meta.env.VITE_API_DIRECT === 'true') return CONFIGURED_API;
  if (import.meta.env.DEV) return '';
  return CONFIGURED_API;  // empty = relative paths → Vercel rewrites handle routing
})();

/**
 * WebSocket base URL.
 * Vercel cannot proxy WebSockets, so WS uses VITE_API_URL directly when set.
 * If empty, wsBaseFromHttp() falls back to window.location.host — WS will fail
 * gracefully on Vercel (wss://detectra-ai.vercel.app/ws/* is not proxied) and
 * the progress page falls back to HTTP polling automatically.
 * For real-time WS support, set VITE_API_URL to an HTTPS-enabled backend URL.
 */
export const WS_API_URL: string = CONFIGURED_API;

/** Build an absolute API URL, useful for non-JSON requests (downloads, live stream, etc.). */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  timeoutMs?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  timeoutMs: 30_000,
};

// Exponential backoff with jitter
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(
  attempt: number,
  options: RetryOptions,
  lastResponseStatus?: number
): number {
  const baseDelayMs     = options.baseDelayMs ?? DEFAULT_RETRY_OPTIONS.baseDelayMs;
  const backoffMultiplier = options.backoffMultiplier ?? DEFAULT_RETRY_OPTIONS.backoffMultiplier;
  const maxDelayMs      = options.maxDelayMs ?? DEFAULT_RETRY_OPTIONS.maxDelayMs;
  const retryableStatuses = options.retryableStatuses ?? DEFAULT_RETRY_OPTIONS.retryableStatuses;

  if (lastResponseStatus === 401 || 
      (lastResponseStatus && lastResponseStatus >= 400 && lastResponseStatus < 500 && 
       !retryableStatuses.includes(lastResponseStatus))) {
    return -1;
  }

  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  const delay = Math.min(exponentialDelay + jitter, maxDelayMs);
  return Math.max(delay, baseDelayMs);
}

async function authHeader(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  try {
    const { data: sessionData } = (await supabase.auth.getSession()) as any;
    let token: string | undefined = sessionData?.session?.access_token;

    if (!token) {
      const { data: refreshData } = (await supabase.auth.refreshSession()) as any;
      token = refreshData?.session?.access_token || token;
    }

    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (err) {
    console.warn('[detectraApi] Auth header error (falling back to anonymous):', err);
    return {};
  }
}

// Enhanced fetch with retry logic
async function apiFetchWithRetry<T>(
  path: string,
  init: RequestInit = {},
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  const options = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= options.maxRetries!; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs!);

    try {
      const headers = await authHeader();
      const res = await fetch(`${API_URL}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...headers, ...(init.headers as Record<string, string> | undefined) },
      });

      lastStatus = res.status;

      if (res.status === 401) {
        if (attempt === 0) {
          await supabase.auth.refreshSession();
          const freshHeaders = await authHeader();
          const retryRes = await fetch(`${API_URL}${path}`, {
            ...init,
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...freshHeaders, ...(init.headers as Record<string, string> | undefined) },
          });
          if (retryRes.ok) {
            return retryRes.json() as Promise<T>;
          }
        }
        // Token refresh failed — sign out so ProtectedRoute redirects to /signin
        await supabase.auth.signOut().catch(() => {});
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (res.ok) {
        return res.json() as Promise<T>;
      }

      const delay = calculateDelay(attempt, options, res.status);
      if (delay > 0 && attempt < options.maxRetries!) {
        await sleep(delay);
        continue;
      }

      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(body.detail || `HTTP ${res.status}: ${res.statusText}`);
    } catch (err: unknown) {
      const delay = calculateDelay(attempt, options, lastStatus);
      
      if (err instanceof Error && err.name === 'AbortError') {
        if (attempt < options.maxRetries! && delay > 0) {
          await sleep(delay);
          continue;
        }
        throw new Error('Request timed out - check your connection');
      }
      
      if (attempt < options.maxRetries! && delay > 0) {
        await sleep(delay);
        continue;
      }

      lastError = err instanceof Error ? err : new Error('Unknown error');
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('Request failed');
}

// Use enhanced retry by default for reliability
function fetchWithRetry<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetchWithRetry<T>(path, init);
}

// --- API calls ---------------------------------------------------------------

async function fetchHealthOnce(url: string): Promise<ApiHealth> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ApiHealth;
    if (data.status !== 'online') throw new Error('API not online');
    return data;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Health check with retries; in dev, also tries VITE_API_URL directly if proxy fails. */
export async function checkHealth(): Promise<ApiHealth> {
  const direct = CONFIGURED_API.replace(/\/$/, '');
  const candidates = import.meta.env.DEV && direct
    ? [`${apiUrl('/health')}`, `${direct}/health`]
    : [`${apiUrl('/health')}`];
  const unique = [...new Set(candidates)];

  let lastError: unknown;
  for (const url of unique) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await fetchHealthOnce(url);
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          await new Promise((r) => window.setTimeout(r, 600 * (attempt + 1)));
        }
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API offline');
}

export async function getApiStats(): Promise<ApiStats | null> {
  try {
    return await fetchWithRetry<ApiStats>('/api/stats');
  } catch {
    return null;
  }
}

/** Fetch API path with Supabase JWT (required for protected job artifacts). */
export async function fetchWithAuth(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await authHeader();
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...headers,
    },
  });
}

/** Returns true when the string is a safe job ID (alphanumeric + hyphen/underscore, 4-64 chars). */
export function isValidJobId(id: string | undefined): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{4,64}$/.test(id.trim());
}

/** Human-readable error for a failed API call, distinguished by HTTP status. */
export function getJobErrorMessage(err: unknown, jobId?: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('404') || msg.toLowerCase().includes('not found'))
    return 'This analysis was not found. It may have expired — please start a new analysis.';
  if (msg.includes('403') || msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('forbidden'))
    return 'Access denied. Sign in to view this analysis.';
  if (msg.includes('429'))
    return 'Too many requests — please wait a moment and try again.';
  if (msg.includes('503') || msg.includes('502'))
    return 'Server is temporarily unavailable. Please try again in a few minutes.';
  if (msg.includes('413') || msg.toLowerCase().includes('too large') || msg.toLowerCase().includes('entity too large'))
    return 'File is too large. Maximum upload size is 500 MB — please choose a smaller video.';
  if (msg.includes('400') || msg.toLowerCase().includes('bad request'))
    return 'Invalid request. Check that your file is a supported video format (MP4, AVI, MOV, MKV, WebM).';
  if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('network'))
    return 'Connection timeout. Check your internet connection and try again.';
  const suffix = jobId ? ` (job: ${jobId.slice(0, 8)})` : '';
  return `${msg}${suffix}`;
}

export async function submitVideo(
  file: File,
  _onProgress?: (pct: number) => void,
  externalSignal?: AbortSignal,
): Promise<SubmitResponse> {
  const headers = await authHeader();
  const form = new FormData();
  form.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);
  // If caller provides a signal (e.g. user cancels upload), abort our controller too
  externalSignal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const res = await fetch(apiUrl('/api/analyze'), {
      method: 'POST',
      body: form,
      headers: headers as Record<string, string>,
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json() as { detail?: string };
        if (body.detail) detail = body.detail;
      } catch { /* ignore parse error */ }
      throw new Error(detail);
    }

    const data = await res.json() as SubmitResponse;
    if (!isValidJobId(data?.job_id)) {
      throw new Error('Server returned an invalid job ID. Please try again.');
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(externalSignal?.aborted ? 'Upload cancelled by user' : 'Upload timed out - file may be too large');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function submitVideoFromUrl(
  publicUrl: string | null,
  storagePath: string | null,
  bucket: string | null,
  videoName: string,
): Promise<SubmitResponse> {
  const headers = await authHeader();
  const body = JSON.stringify({
    public_url: publicUrl,
    storage_path: storagePath,
    bucket: bucket || null,
    video_name: videoName,
  });

  return await apiFetchWithRetry<SubmitResponse>(
    `/api/analyze/url`,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    },
  );
}

export function getJobStatus(jobId: string): Promise<JobStatus> {
  return fetchWithRetry<JobStatus>(`/api/jobs/${jobId}`);
}

export function getJobResult(jobId: string): Promise<AnalysisResult> {
  return fetchWithRetry<AnalysisResult>(`/api/jobs/${jobId}/result`);
}

export async function listMyJobs(userId?: string | null): Promise<JobStatus[]> {
  const headers = await authHeader();
  const authed = Boolean(headers.Authorization);

  if (!authed) {
    return [];
  }

  try {
    const res = await fetchWithRetry<{ jobs?: JobStatus[] } | JobStatus[]>('/api/my-jobs?limit=200');
    // Handle both the legacy array format and the new paginated {jobs:[]} format
    const jobs: JobStatus[] = Array.isArray(res) ? res : (res as { jobs?: JobStatus[] }).jobs ?? [];
    if (userId) {
      return jobs.filter((j) => j.user_id === userId);
    }
    return jobs;
  } catch (err) {
    console.warn('[detectraApi] /api/my-jobs failed:', err);
    return [];
  }
}

export function deleteJob(jobId: string): Promise<void> {
  return fetchWithRetry(`/api/jobs/${jobId}`, { method: 'DELETE' });
}

export function cancelJob(jobId: string): Promise<{ cancelled: string }> {
  return fetchWithRetry(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
}

export function retryJob(jobId: string): Promise<SubmitResponse & { message?: string }> {
  return fetchWithRetry(`/api/jobs/${jobId}/retry`, { method: 'POST' });
}

function wsBaseFromHttp(httpBase: string): string {
  if (httpBase && /^https?:\/\//i.test(httpBase)) {
    return httpBase.replace(/^http/i, 'ws');
  }
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}`;
}

export async function getWsUrl(jobId: string): Promise<string> {
  const base = wsBaseFromHttp(WS_API_URL);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) return `${base}/ws/${jobId}?token=${encodeURIComponent(token)}`;
    } catch { /* fall through to unauthenticated URL */ }
  }
  return `${base}/ws/${jobId}`;
}

/** Live-stream WebSocket URL (same routing rules as getWsUrl). */
export async function getLiveWsUrl(): Promise<string> {
  const base = wsBaseFromHttp(WS_API_URL);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) return `${base}/ws/live?token=${encodeURIComponent(token)}`;
    } catch { /* fall through */ }
  }
  return `${base}/ws/live`;
}

export function getRagJsonUrl(jobId: string): string {
  return apiUrl(`/api/jobs/${jobId}/rag`);
}

export function getReportUrl(jobId: string): string {
  return apiUrl(`/api/jobs/${jobId}/report`);
}

export function getPdfReportUrl(jobId: string): string {
  return apiUrl(`/api/jobs/${jobId}/report/pdf`);
}

export function getVideoUrl(jobId: string): string {
  return apiUrl(`/api/jobs/${jobId}/video`);
}

export function getTranslatedTranscript(
  jobId: string,
  targetLang: string
): Promise<TranscriptTranslationResponse> {
  const lang = encodeURIComponent(targetLang || 'en');
  return fetchWithRetry<TranscriptTranslationResponse>(`/api/jobs/${jobId}/translate?target_lang=${lang}`);
}

/** Server-side RAG Q&A (same pipeline as legacy dashboard) — uses HF_TOKEN on the API. */
export function askJobQuestion(jobId: string, question: string): Promise<JobAskResponse> {
  return fetchWithRetry<JobAskResponse>(`/api/jobs/${jobId}/ask`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// --- UI helpers ---------------------------------------------------------------

export function riskColor(level: RiskLevel | string): string {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#eab308';
    default:         return '#22c55e';
  }
}

export function riskTextClass(level: RiskLevel | string): string {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'text-red-400';
    case 'HIGH':     return 'text-orange-400';
    case 'MEDIUM':   return 'text-yellow-400';
    default:         return 'text-green-400';
  }
}

export function riskBgClass(level: RiskLevel | string): string {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500/15 border-red-500/40';
    case 'HIGH':     return 'bg-orange-500/15 border-orange-500/40';
    case 'MEDIUM':   return 'bg-yellow-500/15 border-yellow-500/40';
    default:         return 'bg-green-500/15 border-green-500/40';
  }
}

export function severityBadgeClass(sev: Severity | string): string {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return 'bg-red-500/25 text-red-300 border-red-500/50';
    case 'high':     return 'bg-orange-500/25 text-orange-300 border-orange-500/50';
    case 'medium':   return 'bg-yellow-500/25 text-yellow-300 border-yellow-500/50';
    default:         return 'bg-blue-500/25 text-blue-300 border-blue-500/50';
  }
}

export function severityHex(sev: Severity | string): string {
  switch ((sev || '').toLowerCase()) {
    case 'critical': return '#ef4444';
    case 'high':     return '#f97316';
    case 'medium':   return '#eab308';
    default:         return '#3b82f6';
  }
}

export function statusLabel(status: JobStatusValue | string): string {
  switch (status) {
    case 'pending':   return 'Queued';
    case 'running':   return 'Analyzing';
    case 'completed': return 'Done';
    case 'failed':    return 'Failed';
    case 'cancelled': return 'Cancelled';
    default:          return status;
  }
}

export function statusBadgeClass(status: JobStatusValue | string): string {
  switch (status) {
    case 'completed': return 'text-green-400 bg-green-500/20';
    case 'running':   return 'text-cyan-400 bg-cyan-500/20';
    case 'pending':   return 'text-yellow-400 bg-yellow-500/20';
    case 'failed':    return 'text-red-400 bg-red-500/20';
    default:          return 'text-gray-400 bg-gray-500/20';
  }
}

export function fmtSeconds(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Distinct people estimated from tracker co-occurrence (not raw ID fragment count). */
export function distinctPersonCount(result: Pick<AnalysisResult, 'distinct_individuals' | 'unique_track_ids'>): number {
  const d = result.distinct_individuals;
  if (typeof d === 'number' && Number.isFinite(d) && d >= 0) return d;
  return (result.unique_track_ids ?? []).length;
}

/** Raw ByteTrack IDs accumulated over the video (often >> distinct people). */
export function trackFragmentCount(result: Pick<AnalysisResult, 'unique_track_ids'>): number {
  return (result.unique_track_ids ?? []).length;
}

export function anomalyColor(score: number): string {
  if (score > 0.75) return '#ef4444';
  if (score > 0.50) return '#f97316';
  if (score > 0.25) return '#eab308';
  return '#374151';
}
