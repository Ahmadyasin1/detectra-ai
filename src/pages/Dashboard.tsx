/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu, UploadCloud, Film, X, Radio, Play, Video, Shield,
  Users, TrendingUp, Brain, FileText, Download, Bell, Loader2, Square,
  Sparkles,
} from 'lucide-react';
import Chart from 'chart.js/auto';
import {
  submitVideo, submitVideoFromUrl, checkHealth, getJobStatus, deleteJob,
  getReportUrl, getVideoUrl, distinctPersonCount, apiUrl, getLiveWsUrl,
  type JobStatus, type AnalysisResult, type ApiHealth,
} from '../lib/detectraApi';
import {
  AnalyzerCommandHero,
  AnalyzerKpi,
  AnalyzerSection,
  AnalyzerCollapsible,
} from '../components/dashboard/AnalyzerUI';
import JobLibraryPanel from '../components/dashboard/JobLibraryPanel';
import { dedupeJobsByVideo } from '../lib/dedupeJobs';
import UserBanner from '../components/ui/UserBanner';
import { validateVideoFile, formatFileSize } from '../lib/userFacing';
import './Dashboard.css';
import {
  createVideoUpload,
  getUserVideoUploads,
  deleteVideoUpload,
  uploadVideoFileToBucket,
  type VideoUpload,
} from '../lib/supabaseDb';
import { loadSecureUserJobHistory, uploadsByJobId } from '../lib/jobListMerge';
import { buildIntegrationSnapshot } from '../lib/integration';
import IntegrationStatusBar from '../components/dashboard/IntegrationStatusBar';
import { isSupabaseConfigured } from '../lib/supabase';
import { addLocalJob, removeLocalJob, getLocalJobs } from '../lib/localJobSession';
import { useToast } from '../contexts/ToastContext';
import { syncUserJobLibraryToDatabase } from '../lib/jobPersistence';
import { loadJobAnalysisResult, jobIsViewable } from '../lib/loadJobResult';

interface AlertEntry {
  id: string;
  event_type: string;
  timestamp: string;
  description: string | undefined;
  isCrit: boolean;
}

const DashboardStyles = () => (
  <style>{`
    .analyzer-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .analyzer-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .analyzer-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
    @keyframes analyzer-scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
    .analyzer-scanline {
      position: absolute; inset-inline: 0; top: 0; height: 2px;
      background: rgba(34, 211, 238, 0.3);
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.35);
      animation: analyzer-scanline 4s linear infinite;
      pointer-events: none; z-index: 10;
    }
    .analyzer-table thead th {
      position: sticky; top: 0; z-index: 5;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(12px);
    }
    .brand-bg-gradient { background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%); }
    .brand-gradient {
      background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
      -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .btn-premium {
      background: linear-gradient(135deg, rgba(34,211,238,0.18), rgba(59,130,246,0.10));
      border: 1px solid rgba(34,211,238,0.28); color: rgba(165,243,252,0.95);
    }
    .btn-premium:hover { background: linear-gradient(135deg, rgba(34,211,238,0.26), rgba(59,130,246,0.14)); }
    .btn-ghost {
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
      color: rgba(226,232,240,0.92);
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.09); }
    .btn-danger {
      background: rgba(244,63,94,0.10); border: 1px solid rgba(244,63,94,0.20);
      color: rgba(251,113,133,0.95);
    }
    .btn-danger:hover { background: rgba(244,63,94,0.16); }
  `}</style>
);

const fmtTime = (s: number) => {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [apiOnline, setApiOnline] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Initializing...');
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [healthKnown, setHealthKnown] = useState(false);
  
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [userUploads, setUserUploads] = useState<VideoUpload[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobQuery, setJobQuery] = useState('');
  const [jobFilter, setJobFilter] = useState<'all' | 'completed' | 'running' | 'pending' | 'failed'>('all');
  
  // Job Data
  const [jobData, setJobData] = useState<AnalysisResult | null>(null);
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [bucketWarning, setBucketWarning] = useState<string | null>(null);
  const [liveAdvancedOpen, setLiveAdvancedOpen] = useState(false);
  
  // Live State
  const [isLive, setIsLive] = useState(false);
  const [streamSrc, setStreamSrc] = useState('0');
  const [liveCanvasSrc, setLiveCanvasSrc] = useState('');
  const [livePersons, setLivePersons] = useState(0);
  const [liveAction, setLiveAction] = useState('IDLE');
  
  // Ledger/Alerts
  const [alertsFeed, setAlertsFeed] = useState<AlertEntry[]>([]);

  // Refs
  const liveWsRef      = useRef<WebSocket | null>(null);
  const densityChartRef= useRef<InstanceType<typeof Chart> | null>(null);
  const anomalyChartRef= useRef<InstanceType<typeof Chart> | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const mountedRef     = useRef(true);

  const checkServerHealth = async () => {
    try {
      const res = await checkHealth();
      setApiOnline(true);
      setHealth(res);
      setHealthKnown(true);
      if (res.models_loaded) {
        const activeCount = (res.running_jobs ?? 0) + (res.queued_jobs ?? 0);
        setBackendStatus(activeCount > 0 ? `ACTIVE JOBS: ${activeCount}` : 'AI MODELS READY');
      } else {
        setBackendStatus('LOADING AI MODELS...');
      }
    } catch (err) {
      console.warn('[Dashboard] health check failed:', err);
      setApiOnline(false);
      setHealth(null);
      setHealthKnown(true);
      setBackendStatus('Cannot reach analysis server');
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      if (user) {
        const [merged, uploads] = await Promise.all([
          loadSecureUserJobHistory(user.id),
          getUserVideoUploads(user.id).catch(() => []),
        ]);
        if (mountedRef.current) setJobs(merged);
        if (mountedRef.current) setUserUploads(uploads);
        void syncUserJobLibraryToDatabase(user.id, merged).then(async () => {
          const refreshed = await getUserVideoUploads(user.id).catch(() => []);
          if (mountedRef.current && refreshed.length) setUserUploads(refreshed);
        });
        return;
      }

      const local = getLocalJobs();
      if (local.length) {
        const statuses = await Promise.all(
          local.map((e) => getJobStatus(e.job_id).catch(() => null)),
        );
        setJobs(statuses.filter((s): s is JobStatus => s !== null));
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.warn('Jobs list fetch failed', err);
      setJobs([]);
    }
  };

  useEffect(() => {
    const TERMINAL = new Set(['completed', 'failed', 'cancelled']);
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      await loadJobs();
      // Stop polling once every job is in a terminal state (no more updates expected)
      setJobs(prev => {
        if (prev.length > 0 && prev.every(j => TERMINAL.has(j.status))) {
          if (interval !== null) { clearInterval(interval); interval = null; }
        }
        return prev;
      });
    };

    loadJobs();
    interval = setInterval(tick, 15000);
    return () => { if (interval !== null) clearInterval(interval); };
  }, [user?.id]);

  // Destroy charts, abort uploads, and close live WS on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      densityChartRef.current?.destroy();
      anomalyChartRef.current?.destroy();
      if (liveWsRef.current) {
        try { liveWsRef.current.close(); } catch { /* noop */ }
        liveWsRef.current = null;
      }
      uploadAbortRef.current?.abort();
      uploadAbortRef.current = null;
    };
  }, []);

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) {
      setUploadError('File too large — maximum 500 MB allowed.');
      return;
    }
    const err = validateVideoFile(file);
    if (err) {
      setUploadError(err);
      return;
    }
    setUploadError(null);
    setSelectedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
  };

  const startUpload = async () => {
    if (!selectedFile) return;
    if (!apiOnline) {
      setUploadError('Analysis server is offline. Wait for API ONLINE or try again in a moment.');
      return;
    }
    const abortCtrl = new AbortController();
    uploadAbortRef.current = abortCtrl;
    setIsUploading(true);
    setUploadError(null);

    try {
      let uploadResult: { storagePath: string; publicUrl: string | null; error: string | null } | null = null;
      if (user && isSupabaseConfigured) {
        uploadResult = await uploadVideoFileToBucket(selectedFile);
      }

      // Only use the bucket-routed path when the upload actually succeeded.
      // On any error we silently fall back to direct multipart upload — this
      // avoids the "Bucket not found / object missing" cascade where the
      // backend later fails to download a path that was never created.
      const bucketOk = !!uploadResult && !uploadResult.error;

      let res;
      if (bucketOk && uploadResult?.publicUrl) {
        res = await submitVideoFromUrl(uploadResult.publicUrl, null, null, selectedFile.name || 'upload.mp4');
      } else if (bucketOk && uploadResult?.storagePath) {
        res = await submitVideoFromUrl(null, uploadResult.storagePath, null, selectedFile.name || 'upload.mp4');
      } else {
        if (uploadResult?.error && uploadResult.error !== 'guest_mode') {
          console.warn(
            `[Dashboard] Supabase bucket upload failed (${uploadResult.error}). Falling back to direct multipart upload.`,
          );
          if (/bucket.*not.*found/i.test(uploadResult.error)) {
            setBucketWarning(
              `Storage bucket "${import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'videos'}" not found in Supabase. ` +
                'Create it in Supabase Dashboard → Storage, or set VITE_SUPABASE_STORAGE_BUCKET to match an existing bucket. ' +
                'Falling back to direct upload for now.',
            );
          }
        }
        res = await submitVideo(selectedFile, undefined, abortCtrl.signal);
      }

      addLocalJob(res.job_id, selectedFile.name || res.video_name);

      if (user && isSupabaseConfigured) {
        await createVideoUpload(user.id, res.job_id, selectedFile.name || res.video_name, {
          ...(uploadResult?.storagePath ? { sourceStoragePath: uploadResult.storagePath } : {}),
          ...(uploadResult?.publicUrl ? { sourcePublicUrl: uploadResult.publicUrl } : {}),
        }).catch(console.warn);
      }
      toast.success('Analysis started!', `"${selectedFile.name}" is queued. You'll see live progress now.`);
      clearFile();
      navigate(`/analyze/progress/${res.job_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      const display = msg.includes('fetch') || msg.includes('network')
        ? 'Network error — check your connection and that the analysis server is online.'
        : msg;
      setUploadError(display);
      toast.error('Upload failed', display);
    } finally {
      setIsUploading(false);
    }
  };

  const applyResultToDashboard = (result: AnalysisResult) => {
    setJobData(result);
    const typed = result as AnalysisResult;
    const densityFrames = typed.frame_analytics?.length
      ? typed.frame_analytics.map(p => ({ timestamp_s: p.t, person_count: p.person_count }))
      : [];
    initDensityChart(densityFrames);
    initAnomalyChart(typed.fusion_insights || []);

    const newAlerts = (result.surveillance_events || [])
      .filter((e) => e.severity === 'critical' || e.severity === 'high')
      .slice()
      .reverse();
    setAlertsFeed(
      newAlerts.slice(0, 20).map((e, i) => ({
        id: `${e.event_type}-${e.timestamp_s}-${i}`,
        event_type: e.event_type,
        timestamp: fmtTime(e.timestamp_s),
        description: e.description,
        isCrit: e.severity === 'critical',
      }))
    );
  };

  const loadJobData = async (jobId: string) => {
    setCurrentJobId(jobId);
    setJobData(null);

    try {
      const result = await loadJobAnalysisResult(jobId, user?.id);
      applyResultToDashboard(result);
      loadJobs();
    } catch {
      console.warn('Load Job Data Error: API offline or job missing, no cached result');
    }
  };

  const pushAlert = (e: { severity?: string; event_type?: string; timestamp_s?: number; description?: string }, liveTs: number | null = null) => {
    setAlertsFeed(prev => {
      const isCrit = e.severity === 'critical';
      const newAlert: AlertEntry = {
        id: Math.random().toString(),
        event_type: e.event_type || 'UNKNOWN',
        timestamp: liveTs != null ? `${liveTs}s` : fmtTime(e.timestamp_s ?? 0),
        description: e.description,
        isCrit,
      };
      const updated = [newAlert, ...prev];
      if (updated.length > 20) return updated.slice(0, 20);
      return updated;
    });
  };

  const initDensityChart = (frames: { timestamp_s: number; person_count: number }[]) => {
    const canvas = document.getElementById('density-chart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (densityChartRef.current) densityChartRef.current.destroy();
    
    densityChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: frames.map(f => fmtTime(f.timestamp_s)),
        datasets: [{
          label: 'Tracks',
          data: frames.map(f => f.person_count),
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.08)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { min: 0, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6e7681', font: { size: 9 } } }
        }
      }
    });
  };

  const initAnomalyChart = (ins: { window_start_s: number; anomaly_score: number }[]) => {
    const canvas = document.getElementById('anomaly-chart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (anomalyChartRef.current) anomalyChartRef.current.destroy();
    
    anomalyChartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ins.map(i => fmtTime(i.window_start_s)),
        datasets: [{
          label: 'Anomaly Score',
          data: ins.map(i => i.anomaly_score),
          backgroundColor: ins.map(i => i.anomaly_score > 0.65 ? 'rgba(244, 63, 94, 0.6)' : i.anomaly_score > 0.4 ? 'rgba(251, 146, 60, 0.5)' : 'rgba(16, 185, 129, 0.3)'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: true, grid: { display: false }, ticks: { color: '#6e7681', font: { size: 8 } } },
          y: { min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6e7681', font: { size: 9 } } }
        }
      }
    });
  };

  const toggleLive = async () => {
    if (isLive) {
      await fetch(apiUrl('/api/live/stop'), { method: 'DELETE' }).catch(console.warn);
      stopLive();
    } else {
      try {
        const res = await fetch(
          apiUrl(`/api/live/start?source=${encodeURIComponent(streamSrc)}`),
          { method: 'POST' },
        );
        if (res.ok) startLive();
        else alert(`Live stream failed (HTTP ${res.status}). Check the backend.`);
      } catch (err) {
        console.error('Live start failed:', err);
        alert('Failed to reach live-stream processor - is the backend running?');
      }
    }
  };

  const startLive = () => {
    setIsLive(true);
    connectLiveSocket();
  };

  const stopLive = () => {
    setIsLive(false);
    if (liveWsRef.current) {
      try { liveWsRef.current.close(); } catch { /* noop */ }
      liveWsRef.current = null;
    }
  };

  const connectLiveSocket = async () => {
    try {
      const ws = new WebSocket(await getLiveWsUrl());
      liveWsRef.current = ws;
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'frame') {
            if (msg.frame_b64) setLiveCanvasSrc(`data:image/jpeg;base64,${msg.frame_b64}`);
            setLivePersons(msg.persons || 0);
            setLiveAction(msg.action || 'IDLE');
            if (Array.isArray(msg.alerts) && msg.alerts.length > 0) {
              msg.alerts.forEach((a: { severity?: string; event_type?: string; timestamp_s?: number; description?: string }) => pushAlert(a, msg.ts as number | null));
            }
          } else if (msg.type === 'live_stopped') {
            stopLive();
          }
        } catch (err) {
          console.warn('[Live] malformed frame:', err);
        }
      };
      ws.onerror = (err) => console.warn('[Live] WebSocket error:', err);
      ws.onclose = () => {
        if (liveWsRef.current === ws) {
          liveWsRef.current = null;
          setIsLive(false);
        }
      };
    } catch (err) {
      console.error('[Live] failed to open WebSocket:', err);
      stopLive();
    }
  };

  const handleDownloadReport = () => {
    if (currentJobId) window.open(getReportUrl(currentJobId), '_blank');
  };

  const handleDownloadVideo = () => {
    if (currentJobId) window.open(getVideoUrl(currentJobId), '_blank');
  };

  const handleOpenJob = (jobId: string, status?: string, hasResult?: boolean, progress?: number) => {
    if (!jobId) return;
    if (jobIsViewable(status, hasResult, progress)) navigate(`/analyze/results/${jobId}`);
    else navigate(`/analyze/progress/${jobId}`);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!jobId) return;
    const ok = confirm('Delete this analysis job (including report/video outputs)?');
    if (!ok) return;
    try {
      await deleteJob(jobId);
      toast.success('Job deleted', 'Analysis job and all output files removed.');
    } catch (err) {
      console.warn('Backend job delete failed:', err);
      toast.warning('Partial delete', 'Job removed from list but some files may remain on server.');
    }
    if (user && isSupabaseConfigured) {
      await deleteVideoUpload(user.id, jobId).catch(() => {});
    }
    if (currentJobId === jobId) setCurrentJobId(null);
    removeLocalJob(jobId);
    await loadJobs();
  };

  // Safe checks for rendering
  const r = jobData;
  const distinctPeopleCount = r ? distinctPersonCount(r as AnalysisResult) : 0;
  const eventsCount = r ? (r.surveillance_events || []).length : 0;
  const speechCount = r ? (r.speech_segments || []).filter((v) => !v.is_noise).length : 0;
  const risk = r?.risk_level || 'STABLE';
  const riskClass = risk === 'CRITICAL' ? 'text-rose-500' : risk === 'HIGH' ? 'text-orange-400' : 'text-cyan-400';
  const displayJobs = useMemo(() => dedupeJobsByVideo(jobs) ?? [], [jobs]);
  const uploadsByJob = useMemo(() => uploadsByJobId(userUploads), [userUploads]);

  const filteredJobs = displayJobs
    .filter(j => {
      if (jobFilter === 'all') return true;
      if (jobFilter === 'running') return j.status === 'running';
      if (jobFilter === 'pending') return j.status === 'pending';
      if (jobFilter === 'completed') return j.status === 'completed';
      if (jobFilter === 'failed') return j.status === 'failed';
      return true;
    })
    .filter(j => {
      const q = jobQuery.trim().toLowerCase();
      if (!q) return true;
      return (j.video_name || '').toLowerCase().includes(q) || (j.job_id || '').toLowerCase().includes(q);
    });

  const triggerFileUpload = () => {
    (document.querySelector('#analyzer-file-input') as HTMLInputElement | null)?.click();
  };

  const runningCount = displayJobs.filter(
    (j) => j.status === 'running' || j.status === 'pending',
  ).length;
  const integration = buildIntegrationSnapshot(health, {
    userId: user?.id,
    apiOnline,
    healthKnown,
  });

  return (
    <>
      <DashboardStyles />
      <motion.div className="analyzer-page min-h-screen bg-transparent text-white overflow-x-hidden">
        <section className="relative pt-20 sm:pt-24 pb-6 sm:pb-8">
          <div className="page-shell">
            <AnalyzerCommandHero
              onUpload={triggerFileUpload}
              onRefresh={loadJobs}
              apiOnline={apiOnline}
              jobsCount={displayJobs.length}
              modelsReady={!!health?.models_loaded}
              backendStatus={backendStatus}
              version={health?.version ? `v${health.version}` : undefined}
              accountLinked={!!user}
              cloudSync={!!health?.supabase_configured}
            />
            <div className="mt-4">
              <IntegrationStatusBar snapshot={integration} />
            </div>
          </div>
        </section>

        <div
          className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent page-shell"
          aria-hidden
        />

        <div className="page-shell space-y-6 pb-16 pt-8 sm:pt-10">
        {!user && isSupabaseConfigured && (
            <UserBanner variant="warning">
              Sign in to save analysis history securely to your account. Uploads still work as a guest on this device only.
            </UserBanner>
        )}
        {user && isSupabaseConfigured && healthKnown && health && !health.supabase_configured && (
            <UserBanner variant="warning">
              Your account is connected, but the analysis server is not syncing to Supabase yet. Jobs are still saved in this browser.{' '}
              {health.on_heroku
                ? 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Heroku config vars.'
                : 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your backend .env file, then restart the server.'}
            </UserBanner>
        )}
        {!user && !isSupabaseConfigured && (
            <UserBanner variant="warning">
              Guest mode: add Supabase keys in .env for accounts and cloud history. Video analysis still works against the API.
            </UserBanner>
        )}
        {!apiOnline && (
            <UserBanner
              variant="error"
              title="Analysis server unavailable"
              action={
                <button
                  type="button"
                  onClick={checkServerHealth}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200"
                >
                  Retry
                </button>
              }
            >
              Cannot connect to the AI backend. Uploads are paused until the server is back online.
            </UserBanner>
        )}
        {uploadError && (
            <UserBanner variant="error" onDismiss={() => setUploadError(null)}>
              {uploadError}
            </UserBanner>
        )}
        {bucketWarning && (
            <div className="elite-card border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start justify-between gap-3">
              <span className="text-sm text-amber-200/90 leading-relaxed">{bucketWarning}</span>
              <button
                onClick={() => setBucketWarning(null)}
                type="button"
                className="text-sm text-amber-300 hover:text-amber-100 shrink-0 min-h-[44px] px-2"
              >
                Dismiss
              </button>
            </div>
        )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
            <AnalyzerSection title="New analysis" icon={UploadCloud}>
              {!selectedFile ? (
                <label
                  className={`analyzer-upload-zone ${isDragOver ? 'analyzer-upload-zone--active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  <input id="analyzer-file-input" type="file" className="hidden" accept="video/*,.mp4,.mov,.avi,.mkv,.webm" onChange={handleFileSelect} />
                  <span className="analyzer-upload-icon" aria-hidden>
                    <Film className="h-6 w-6 text-cyan-400" />
                  </span>
                  <span className="text-sm font-semibold text-gray-100">Drop video or browse</span>
                  <span className="mt-1 text-xs text-gray-500 text-center">MP4, MOV, AVI, MKV  |   max 500 MB</span>
                </label>
              ) : (
                <motion.div className="space-y-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs truncate flex-1 font-medium" title={selectedFile.name}>
                      {selectedFile.name}
                      <span className="block text-[10px] text-slate-500 font-normal">{formatFileSize(selectedFile.size)}</span>
                    </span>
                    <button onClick={clearFile} className="p-1 text-slate-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button 
                    onClick={startUpload}
                    disabled={isUploading}
                    className="analyzer-btn-primary w-full min-h-[48px] disabled:opacity-50"
                  >
                    {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : 'Run multimodal analysis'}
                  </button>
                </motion.div>
              )}
            </AnalyzerSection>

            <AnalyzerCollapsible
              title="Live camera (advanced)"
              icon={Radio}
              open={liveAdvancedOpen}
              onToggle={() => setLiveAdvancedOpen((v) => !v)}
            >
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={streamSrc}
                  onChange={(e) => setStreamSrc(e.target.value)}
                  placeholder="Source (0 or URL)" 
                  className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-cyan-500/50 outline-none text-slate-300" 
                />
                <button 
                  onClick={toggleLive}
                  className={`px-4 py-2 rounded-lg border font-bold text-xs hover:bg-opacity-20 transition-all flex items-center gap-1.5 ${
                    isLive 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                  }`}
                >
                  {isLive ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Go live</>}
                </button>
              </div>
            </AnalyzerCollapsible>

          </aside>

          <section className="lg:col-span-8 flex flex-col gap-5 min-w-0">
            <div className="space-y-5">

              {!r && !isLive && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">
                    Select a job from the library below or upload a video to see metrics and charts.
                  </p>
                  <button
                    type="button"
                    onClick={triggerFileUpload}
                    className="analyzer-btn-primary mt-4 min-h-[44px] px-5"
                  >
                    Upload video
                  </button>
                </div>
              )}

              {/* Live Preview Stage */}
              <div className={`animate-in zoom-in-95 duration-300 ${!isLive ? 'hidden' : ''}`}>
                <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl elite-card">
                  <div className="analyzer-scanline"></div>
                  {liveCanvasSrc && <img src={liveCanvasSrc} className="w-full h-auto min-h-[300px] object-contain" alt="SURVEILLANCE FEED" />}
                  <div className="absolute top-4 left-4 flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/90 rounded-md shadow-lg animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span className="text-[10px] font-black uppercase text-white tracking-widest">LIVE FEED</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-mono font-bold">{livePersons.toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="px-2 py-0.5 bg-cyan-500 text-black inline-block text-[10px] font-black uppercase rounded">{liveAction}</div>
                      <div className="text-[10px] font-mono text-white/70 drop-shadow-md">CAM_01 // MULTIMODAL_FUSION_ACTIVE</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <AnalyzerKpi icon={Users} label="People tracked" value={distinctPeopleCount.toString().padStart(2, '0')} valueClassName="brand-gradient analyzer-mono" />
                <AnalyzerKpi icon={Bell} label="Security events" value={eventsCount.toString().padStart(2, '0')} valueClassName="text-rose-400 analyzer-mono" />
                <AnalyzerKpi icon={Shield} label="Risk level" value={risk} valueClassName={`text-base uppercase ${riskClass}`} />
                <AnalyzerKpi icon={Cpu} label="Audio cues" value={speechCount.toString().padStart(2, '0')} valueClassName="text-sky-400 analyzer-mono" />
                <AnalyzerKpi icon={Sparkles} label="Analysis" value={r ? 'Ready' : '-'} valueClassName="text-cyan-400 text-sm" hint={r ? 'Metrics loaded' : 'Select a job'} />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 elite-card rounded-3xl space-y-4">
                  <h4 className="elite-label flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Track density
                  </h4>
                  <div className="h-48 relative w-full">
                    <canvas id="density-chart"></canvas>
                  </div>
                </div>
                <div className="p-6 elite-card rounded-3xl space-y-4">
                  <h4 className="elite-label flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> Anomaly fusion
                  </h4>
                  <div className="h-48 relative w-full">
                    <canvas id="anomaly-chart"></canvas>
                  </div>
                </div>
              </div>

              {/* Event Ledger */}
              <div className="elite-card rounded-3xl overflow-hidden border border-white/10">
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
                  <h4 className="elite-label">Event ledger</h4>
                  <span className="px-2 py-0.5 bg-white/10 text-slate-300 text-[10px] rounded-full font-mono">{eventsCount} ENTRIES</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-separate border-spacing-0 analyzer-table">
                    <thead>
                      <tr className="bg-white/5 backdrop-blur-md">
                        <th className="px-6 py-3 border-b border-white/10 text-slate-500 uppercase font-bold tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 border-b border-white/10 text-slate-500 uppercase font-bold tracking-wider">Severity</th>
                        <th className="px-6 py-3 border-b border-white/10 text-slate-500 uppercase font-bold tracking-wider">Classification</th>
                        <th className="px-6 py-3 border-b border-white/10 text-slate-500 uppercase font-bold tracking-wider">Contextual Description</th>
                        <th className="px-6 py-3 border-b border-white/10 text-slate-500 uppercase font-bold tracking-wider text-right">Conf %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#21262d]/50">
                      {eventsCount === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-500 italic">No anomalies detected or load a completed job.</td>
                        </tr>
                      ) : (
                        (r?.surveillance_events ?? []).map((e, idx) => (
                          <tr key={idx} className={`transition-colors group ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''} hover:bg-white/5`}>
                              <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{fmtTime(e.timestamp_s)}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                    e.severity==='critical'?'bg-rose-500/20 text-rose-500':'bg-orange-500/20 text-orange-400'
                                  }`}>{e.severity}</span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-200 capitalize w-max truncate">{e.event_type.replace(/_/g, ' ')}</td>
                              <td className="px-6 py-4 text-slate-400 group-hover:text-slate-200 transition-colors w-max">{e.description}</td>
                              <td className="px-6 py-4 text-right font-mono text-slate-500">{Math.round(e.confidence*100)}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            {r && (
              <motion.div layout className="elite-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-cyan-500/20">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold truncate text-white">{r.video_name}</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {Math.floor(r.duration_s || 0)}s  |   {r.height}p @ {Math.round(r.fps)}fps  |   {eventsCount} events
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                  <Link
                    to={`/analyze/results/${currentJobId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 font-semibold text-sm transition-all min-h-[44px]"
                  >
                    <Brain className="w-4 h-4" /> Full analysis
                  </Link>
                  <button type="button" onClick={handleDownloadReport} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 border border-white/20 font-semibold text-sm transition-all min-h-[44px]">
                    <FileText className="w-4 h-4" /> Export report
                  </button>
                  <button type="button" onClick={handleDownloadVideo} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl brand-bg-gradient text-slate-900 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 min-h-[44px]">
                    <Download className="w-4 h-4" /> Download video
                  </button>
                </div>
              </motion.div>
            )}

              {alertsFeed.length > 0 && (
                <AnalyzerSection title="Live insights" icon={Bell}>
                  <div className="max-h-48 space-y-2 overflow-y-auto analyzer-scroll">
                    {alertsFeed.map((e) => (
                      <div
                        key={e.id}
                        className={`analyzer-insight-card ${e.isCrit ? 'analyzer-insight-card--critical' : 'analyzer-insight-card--warn'}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase ${e.isCrit ? 'text-rose-400' : 'text-amber-400'}`}>
                            {e.event_type.replace(/_/g, ' ')}
                          </span>
                          <span className="analyzer-mono text-[10px] text-gray-600">{e.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-300">{e.description}</p>
                      </div>
                    ))}
                  </div>
                </AnalyzerSection>
              )}
            </div>
          </section>
          </div>

          <JobLibraryPanel
            jobs={displayJobs}
            filteredJobs={filteredJobs}
            uploadsByJob={uploadsByJob}
            jobQuery={jobQuery}
            onJobQueryChange={setJobQuery}
            jobFilter={jobFilter}
            onJobFilterChange={setJobFilter}
            currentJobId={currentJobId}
            runningCount={runningCount}
            onRefresh={loadJobs}
            onOpen={handleOpenJob}
            onPreview={loadJobData}
            onDelete={handleDeleteJob}
          />

        </div>
      </motion.div>
    </>
  );
}
