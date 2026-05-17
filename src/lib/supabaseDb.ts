import { supabase, isSupabaseConfigured } from './supabase';
import type { AnalysisResult } from './detectraApi';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VideoUploadArtifacts = {
  report_url?: string;
  labeled_video_api_url?: string;
  labeled_video_storage_path?: string;
  labeled_video_public_url?: string;
  rag_url?: string;
  api_base?: string;
  source_storage_path?: string;
  source_public_url?: string;
  saved_at?: string;
  processing_time_s?: number;
  duration_s?: number;
  risk_level?: string;
  risk_score?: number;
  video_name?: string;
  has_report?: boolean;
  has_video?: boolean;
};

export interface VideoUpload {
  id: string;
  user_id: string;
  video_url: string;           // stores "detectra-job://{jobId}"
  title: string;
  description: string | null;
  status: 'processing' | 'completed' | 'failed';
  analysis_results: AnalysisResult | null;
  artifacts?: VideoUploadArtifacts | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function jobIdToVideoUrl(jobId: string): string {
  return `detectra-job://${jobId}`;
}

export function videoUrlToJobId(videoUrl: string): string | null {
  if (!videoUrl?.startsWith('detectra-job://')) return null;
  return videoUrl.slice('detectra-job://'.length) || null;
}

interface SupabaseLikeError {
  message: string;
  code?: string;
  hint?: string;
  details?: string;
}

function logSupabaseError(fn: string, error: SupabaseLikeError): void {
  console.error(`[supabaseDb] ${fn} error:`, {
    message: error.message,
    code: error.code ?? 'n/a',
    hint: error.hint ?? 'n/a',
    details: error.details ?? 'n/a',
  });
}

/** Resolve to current access token, or null if no session / Supabase disabled. */
async function maybeSession(): Promise<{ token: string | null; userId: string | null }> {
  if (!isSupabaseConfigured) return { token: null, userId: null };
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) return { token: null, userId: null };
    return {
      token: data.session.access_token,
      userId: data.session.user?.id ?? null,
    };
  } catch {
    return { token: null, userId: null };
  }
}

// ─── video_uploads ────────────────────────────────────────────────────────────

export async function createVideoUpload(
  userId: string,
  jobId: string,
  title: string,
  extras?: { artifacts?: VideoUploadArtifacts; sourceStoragePath?: string; sourcePublicUrl?: string },
): Promise<VideoUpload | null> {
  if (!isSupabaseConfigured) return null;

  const { token, userId: sessionUid } = await maybeSession();
  if (!token) {
    console.warn('[supabaseDb] createVideoUpload skipped — no session');
    return null;
  }
  if (sessionUid && sessionUid !== userId) {
    console.warn('[supabaseDb] createVideoUpload refused — session user mismatch');
    return null;
  }

  const artifacts: VideoUploadArtifacts = {
    ...(extras?.artifacts ?? {}),
    ...(extras?.sourceStoragePath ? { source_storage_path: extras.sourceStoragePath } : {}),
    ...(extras?.sourcePublicUrl ? { source_public_url: extras.sourcePublicUrl } : {}),
  };

  const { data, error } = await supabase
    .from('video_uploads')
    .insert({
      user_id: userId,
      video_url: jobIdToVideoUrl(jobId),
      title: title || 'Untitled Analysis',
      description: null,
      status: 'processing',
      analysis_results: null,
      artifacts,
    })
    .select()
    .single();

  if (error) {
    if (String(error.message).includes('artifacts')) {
      const { data: retry, error: err2 } = await supabase
        .from('video_uploads')
        .insert({
          user_id: userId,
          video_url: jobIdToVideoUrl(jobId),
          title: title || 'Untitled Analysis',
          description: null,
          status: 'processing',
          analysis_results: null,
        })
        .select()
        .single();
      if (!err2) return retry as VideoUpload;
    }
    logSupabaseError('createVideoUpload', error);
    return null;
  }
  return data as VideoUpload;
}

export async function updateVideoUpload(
  userId: string,
  jobId: string,
  update: Partial<
    Pick<VideoUpload, 'status' | 'analysis_results' | 'title' | 'description' | 'artifacts'>
  >,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { token, userId: sessionUid } = await maybeSession();
  if (!token) return;
  if (sessionUid && sessionUid !== userId) {
    console.warn('[supabaseDb] updateVideoUpload refused — session user mismatch');
    return;
  }

  const row: Record<string, unknown> = { ...update, updated_at: new Date().toISOString() };
  if (update.artifacts) {
    const cur = await getVideoUploadByJobId(userId, jobId);
    row.artifacts = { ...(cur?.artifacts ?? {}), ...update.artifacts };
  }

  let { error } = await supabase
    .from('video_uploads')
    .update(row)
    .eq('user_id', userId)
    .eq('video_url', jobIdToVideoUrl(jobId));

  if (error && String(error.message).includes('artifacts') && update.artifacts) {
    const rest = { ...row };
    delete rest.artifacts;
    ({ error } = await supabase
      .from('video_uploads')
      .update(rest)
      .eq('user_id', userId)
      .eq('video_url', jobIdToVideoUrl(jobId)));
  }

  if (error) logSupabaseError('updateVideoUpload', error);
}

export async function getUserVideoUploads(userId: string): Promise<VideoUpload[]> {
  if (!isSupabaseConfigured) return [];

  const { userId: sessionUid } = await maybeSession();
  if (sessionUid && sessionUid !== userId) return [];

  const { data, error } = await supabase
    .from('video_uploads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('getUserVideoUploads', error);
    return [];
  }
  return (data ?? []) as VideoUpload[];
}

export async function getVideoUploadByJobId(
  userId: string,
  jobId: string,
): Promise<VideoUpload | null> {
  if (!isSupabaseConfigured) return null;

  const { userId: sessionUid } = await maybeSession();
  if (sessionUid && sessionUid !== userId) return null;

  const { data, error } = await supabase
    .from('video_uploads')
    .select('*')
    .eq('user_id', userId)
    .eq('video_url', jobIdToVideoUrl(jobId))
    .single();

  if (error) {
    if (error.code !== 'PGRST116') logSupabaseError('getVideoUploadByJobId', error);
    return null;
  }
  return data as VideoUpload;
}

const STORAGE_BUCKET = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string | undefined) || 'videos';

export async function uploadVideoFileToBucket(
  file: File,
  bucketName: string = STORAGE_BUCKET,
): Promise<{ storagePath: string; publicUrl: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { storagePath: '', publicUrl: null, error: 'guest_mode' };
  }

  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `uploads/${uuid}-${sanitizedFileName}`;

  const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
    upsert: false,
    cacheControl: '3600',
  });

  if (error) {
    logSupabaseError('uploadVideoFileToBucket', error);
    return { storagePath, publicUrl: null, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: publicUrlData?.publicUrl ?? null,
    error: null,
  };
}

export async function deleteVideoUpload(userId: string, jobId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('video_uploads')
    .delete()
    .eq('user_id', userId)
    .eq('video_url', jobIdToVideoUrl(jobId));

  if (error) logSupabaseError('deleteVideoUpload', error);
}

// ─── contact_submissions ──────────────────────────────────────────────────────

export async function submitContactForm(
  submission: Omit<ContactSubmission, 'id' | 'created_at'>,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    console.warn('[supabaseDb] submitContactForm — Supabase disabled, submission discarded');
    return { error: 'guest_mode' };
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name: submission.name,
    email: submission.email,
    message: submission.message,
  });

  if (error) {
    logSupabaseError('submitContactForm', error);
    return { error: error.message };
  }
  return { error: null };
}

// ─── demo_analytics ───────────────────────────────────────────────────────────

export async function trackDemoAnalytic(
  userId: string | null,
  sessionId: string,
  demoType: string,
  actionType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('demo_analytics').insert({
    event: `${demoType}.${actionType}`,
    properties: {
      session_id: sessionId,
      demo_type: demoType,
      action_type: actionType,
      ...metadata,
    },
    user_id: userId,
  });

  if (error) {
    logSupabaseError('trackDemoAnalytic', error);
  }
}
