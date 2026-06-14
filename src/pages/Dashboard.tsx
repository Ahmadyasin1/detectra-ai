/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cpu, UploadCloud, Film, X, Radio, Play, Video, Shield,
  Users, TrendingUp, Brain, FileText, Download, Bell, Loader2, Square,
  Sparkles, Zap, Activity, Clock, Target, Search, ChevronRight, BarChart2,
} from 'lucide-react';
import Chart from 'chart.js/auto';
import {
  submitVideo, submitVideoFromUrl, checkHealth, getJobStatus, deleteJob,
  getReportUrl, getVideoUrl, distinctPersonCount, apiUrl, getLiveWsUrl,
  getExportCsvUrl,
  type JobStatus, type AnalysisResult, type ApiHealth,
} from '../lib/detectraApi';
import {
  AnalyzerCommandHero,
  AnalyzerKpi,
  AnalyzerSection,
  AnalyzerCollapsible,
  AnalyzerWorkspaceEmpty,
} from '../components/dashboard/AnalyzerUI';
import JobLibraryPanel from '../components/dashboard/JobLibraryPanel';
import { dedupeJobsByVideo } from '../lib/dedupeJobs';
import UserBanner from '../components/ui/UserBanner';
import { validateVideoFile, formatFileSize } from '../lib/userFacing';
import { useToast } from '../contexts/ToastContext';
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
import { syncUserJobLibraryToDatabase } from '../lib/jobPersistence';
import { loadJobAnalysisResult, jobIsViewable } from '../lib/loadJobResult';

interface AlertEntry {
  id: string;
  event_type: string;
  timestamp: string;
  description: string | undefined;
  isCrit: boolean;
}

/* ── Risk arc gauge ──────────────────────────────────────────────────────── */
function RiskGaugeSVG({ risk }: { risk: string }) {
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const pctMap: Record<string, number> = {
    STABLE: 0.1, LOW: 0.25, ELEVATED: 0.45, MODERATE: 0.55, HIGH: 0.72, CRITICAL: 0.95,
  };
  const colorMap: Record<string, string> = {
    STABLE: '#22d3ee', LOW: '#34d399', ELEVATED: '#fbbf24', MODERATE: '#fb923c', HIGH: '#f97316', CRITICAL: '#f43f5e',
  };
  const pct = pctMap[risk] ?? 0.15;
  const color = colorMap[risk] ?? '#22d3ee';
  const arcFill = circ * 0.75 * pct;
  const arcGap = circ - arcFill;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full risk-gauge-svg" role="img" aria-label={`Risk level: ${risk}`}>
      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" transform="rotate(135 50 50)" />
      <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${arcFill} ${arcGap}`} strokeLinecap="round" transform="rotate(135 50 50)"
        style={{ filter: `drop-shadow(0 0 8px ${color}bb)`, transition: 'stroke-dasharray 1.2s ease' }} />
      <text x="50" y="45" textAnchor="middle" fill={color} fontSize="10" fontWeight="900"
        fontFamily="ui-monospace,SFMono-Regular,monospace" letterSpacing="-0.5">{risk}</text>
      <text x="50" y="58" textAnchor="middle" fill="rgba(107,114,128,1)" fontSize="6" fontWeight="600" letterSpacing="1.5">THREAT LEVEL</text>
    </svg>
  );
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
  const toast    = useToast();
  
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

  // UI state
  const [eventSearch, setEventSearch] = useState('');
  const [intelTab, setIntelTab] = useState<'events' | 'audio' | 'speech'>('events');

  // Refs
  const liveWsRef = useRef<WebSocket | null>(null);
  const densityChartRef = useRef<InstanceType<typeof Chart> | null>(null);
  const anomalyChartRef = useRef<InstanceType<typeof Chart> | null>(null);

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
        setJobs(merged);
        setUserUploads(uploads);
        void syncUserJobLibraryToDatabase(user.id, merged).then(async () => {
          const refreshed = await getUserVideoUploads(user.id).catch(() => []);
          if (refreshed.length) setUserUploads(refreshed);
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
    loadJobs();
    const interval = setInterval(loadJobs, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Destroy charts and close live WS on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      densityChartRef.current?.destroy();
      anomalyChartRef.current?.destroy();
      if (liveWsRef.current) {
        try { liveWsRef.current.close(); } catch { /* noop */ }
        liveWsRef.current = null;
      }
    };
  }, []);

  const pickFile = (file: File | undefined) => {
    if (!file) return;
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
    setIsUploading(true);
    setUploadError(null);

    try {
      let uploadResult: { storagePath: string; publicUrl: string | null; error: string | null } | null = null;
      if (user && isSupabaseConfigured) {
        uploadResult = await uploadVideoFileToBucket(selectedFile);
      }

      // Only use the bucket-routed path when the upload actually succeeded.
      // On any error we silently fall back to direct multipart upload â€” this
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
                'Create it in Supabase Dashboard â†’ Storage, or set VITE_SUPABASE_STORAGE_BUCKET to match an existing bucket. ' +
                'Falling back to direct upload for now.',
            );
          }
        }
        res = await submitVideo(selectedFile);
      }

      addLocalJob(res.job_id, selectedFile.name || res.video_name);

      if (user && isSupabaseConfigured) {
        await createVideoUpload(user.id, res.job_id, selectedFile.name || res.video_name, {
          ...(uploadResult?.storagePath ? { sourceStoragePath: uploadResult.storagePath } : {}),
          ...(uploadResult?.publicUrl ? { sourcePublicUrl: uploadResult.publicUrl } : {}),
        }).catch(console.warn);
      }
      clearFile();
      toast.success(
        'Analysis queued',
        `”${selectedFile.name}” is uploading — you'll see live progress now.`,
        { persist: true, category: 'analysis', actionLabel: 'View progress', actionHref: `/analyze/progress/${res.job_id}` },
      );
      navigate(`/analyze/progress/${res.job_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      const display = msg.includes('fetch') || msg.includes('network')
        ? 'Network error — check your connection and that the analysis server is online.'
        : msg;
      toast.error('Upload failed', display);
      setUploadError(display);
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

  const connectLiveSocket = () => {
    try {
      const ws = new WebSocket(getLiveWsUrl());
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
    let backendOk = true;
    try {
      await deleteJob(jobId);
    } catch (err) {
      backendOk = false;
      console.warn('Backend job delete failed:', err);
    }
    if (user && isSupabaseConfigured) {
      await deleteVideoUpload(user.id, jobId).catch(() => {});
    }
    if (currentJobId === jobId) setCurrentJobId(null);
    removeLocalJob(jobId);
    await loadJobs();
    if (backendOk) {
      toast.success('Job deleted', 'Analysis job and all output files removed.');
    } else {
      toast.warning('Partial delete', 'Job removed from list but some files may remain on server.');
    }
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

  const fusionAlertsCount = r ? (r.fusion_insights || []).filter(f => f.anomaly_score > 0.5).length : 0;
  const avgConfidence = r && eventsCount > 0
    ? Math.round((r.surveillance_events || []).reduce((acc, e) => acc + e.confidence, 0) / eventsCount * 100)
    : 0;
  const currentJob = useMemo(() => displayJobs.find(j => j.job_id === currentJobId), [displayJobs, currentJobId]);
  const processingTime = (currentJob as any)?.processing_s ? `${Math.round((currentJob as any).processing_s)}s` : '--';

  const filteredEvents = useMemo(() => {
    const evts = r?.surveillance_events ?? [];
    if (!eventSearch) return evts;
    const q = eventSearch.toLowerCase();
    return evts.filter(e =>
      e.event_type.toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
    );
  }, [r, eventSearch]);

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
                  className={`upload-zone-premium ${isDragOver ? 'upload-zone-premium--on' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  <input id="analyzer-file-input" type="file" className="hidden" accept="video/*,.mp4,.mov,.avi,.mkv,.webm" onChange={handleFileSelect} />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 flex items-center justify-center mb-1 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
                      <Film className="h-6 w-6 text-cyan-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-100">Drop video or click to browse</span>
                    <span className="text-xs text-gray-600 text-center">MP4 · MOV · AVI · MKV · WebM · max 500 MB</span>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-600">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07]">8-stage AI pipeline</span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07]">Real-time progress</span>
                    </div>
                  </div>
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

            {/* Quick Actions — shown only when a job result is loaded */}
            {currentJobId && r && (
              <div className="analyzer-vault p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 mb-3 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Quick Actions
                </p>
                <Link to={`/analyze/results/${currentJobId}`} className="qa-btn">
                  <span className="qa-btn-icon"><Brain className="w-3.5 h-3.5 text-cyan-400" /></span>
                  Full Analysis Report
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-600" aria-hidden />
                </Link>
                <button type="button" onClick={handleDownloadReport} className="qa-btn">
                  <span className="qa-btn-icon"><FileText className="w-3.5 h-3.5 text-cyan-400" /></span>
                  Download PDF Report
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-600" aria-hidden />
                </button>
                <a href={getExportCsvUrl(currentJobId)} className="qa-btn" download>
                  <span className="qa-btn-icon"><Download className="w-3.5 h-3.5 text-cyan-400" /></span>
                  Export CSV Data
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-600" aria-hidden />
                </a>
                <button type="button" onClick={handleDownloadVideo} className="qa-btn">
                  <span className="qa-btn-icon"><Video className="w-3.5 h-3.5 text-cyan-400" /></span>
                  Download Labeled Video
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-600" aria-hidden />
                </button>
              </div>
            )}

            {/* System Status & Pipeline Modules */}
            <div className="analyzer-vault p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Active Pipeline Modules
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['YOLOv8', 'ByteTrack', 'Whisper', 'PANNs', 'ViT-B/16', 'CrossAttn', 'MultiAgent'].map(m => (
                  <span key={m} className="cap-badge">
                    <span className="cap-badge-dot" />
                    {m}
                  </span>
                ))}
              </div>
              <div className="space-y-0">
                <div className="sys-metric-row">
                  <span className="text-[10px] text-gray-600">API Status</span>
                  <div className="flex items-center gap-1.5">
                    {apiOnline ? <div className="live-dot" /> : <div className="live-dot-offline" />}
                    <span className={`text-[10px] font-bold ${apiOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {apiOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="sys-metric-row">
                  <span className="text-[10px] text-gray-600">Active jobs</span>
                  <span className="text-[10px] font-bold text-cyan-400 font-mono">{runningCount}</span>
                </div>
                <div className="sys-metric-row">
                  <span className="text-[10px] text-gray-600">Total analyses</span>
                  <span className="text-[10px] font-bold text-cyan-400 font-mono">{displayJobs.length}</span>
                </div>
                <div className="sys-metric-row">
                  <span className="text-[10px] text-gray-600">Models loaded</span>
                  <span className={`text-[10px] font-bold ${health?.models_loaded ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {health?.models_loaded ? 'Yes' : 'Loading'}
                  </span>
                </div>
              </div>
            </div>

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
                <AnalyzerWorkspaceEmpty
                  onUpload={triggerFileUpload}
                  onViewCompleted={() => {
                    document.getElementById('job-library-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              )}

              {/* Live Preview Stage */}
              <div className={`animate-in zoom-in-95 duration-300 ${!isLive ? 'hidden' : ''}`}>
                <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden shadow-2xl elite-card">
                  <div className="analyzer-scanline"></div>
                  {liveCanvasSrc && <img src={liveCanvasSrc} className="w-full h-auto min-h-[300px] object-contain" alt="SURVEILLANCE FEED" />}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="live-badge bg-red-600/90 text-white shadow-lg shadow-red-900/40 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                      REC · LIVE
                    </div>
                    <div className="live-badge bg-black/60 backdrop-blur-md border border-white/15 text-white">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span className="font-mono">{livePersons.toString().padStart(2, '0')} tracked</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500 text-black rounded-lg text-[10px] font-black uppercase tracking-wider">
                        <Activity className="w-3 h-3" /> {liveAction}
                      </div>
                      <p className="text-[10px] font-mono text-white/60">CAM_01 · MULTIMODAL FUSION ACTIVE</p>
                    </div>
                    <div className="text-right">
                      <div className="audio-vis mb-1">
                        {[6, 13, 8, 15, 10].map((h, i) => <div key={i} className="audio-bar" style={{ height: `${h}px` }} />)}
                      </div>
                      <p className="text-[9px] text-white/40 font-mono">AUDIO</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <AnalyzerKpi icon={Users} label="People tracked" value={distinctPeopleCount.toString().padStart(2, '0')} valueClassName="brand-gradient analyzer-mono" hint="Unique subjects" />
                <AnalyzerKpi icon={Bell} label="Security events" value={eventsCount.toString().padStart(2, '0')} valueClassName="text-rose-400 analyzer-mono" hint="All severity levels" />
                <AnalyzerKpi icon={Shield} label="Risk level" value={risk} valueClassName={`text-base uppercase ${riskClass}`} hint="AI threat assessment" />
                <AnalyzerKpi icon={Cpu} label="Speech segments" value={speechCount.toString().padStart(2, '0')} valueClassName="text-sky-400 analyzer-mono" hint="Transcribed segments" />
                <AnalyzerKpi icon={Target} label="Fusion alerts" value={fusionAlertsCount.toString().padStart(2, '0')} valueClassName="text-amber-400 analyzer-mono" hint="Anomaly score > 0.5" />
                <AnalyzerKpi icon={Activity} label="Avg confidence" value={avgConfidence > 0 ? `${avgConfidence}%` : '--'} valueClassName="text-emerald-400 text-lg" hint="Event confidence mean" />
                <AnalyzerKpi icon={Clock} label="Processing time" value={processingTime} valueClassName="text-purple-400 text-lg" hint="Total pipeline runtime" />
                <AnalyzerKpi icon={Sparkles} label="AI analysis" value={r ? 'Ready' : '—'} valueClassName="text-cyan-400 text-sm" hint={r ? '8-stage pipeline done' : 'Select a job'} />
              </div>

              {/* Threat Overview — Risk Gauge + Summary + Distribution */}
              {r && (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  {/* Arc gauge */}
                  <div className="elite-card rounded-3xl p-5 flex flex-col items-center justify-center gap-2">
                    <div className="w-40 h-40">
                      <RiskGaugeSVG risk={risk} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Threat Assessment</p>
                  </div>

                  {/* Analysis Summary */}
                  <div className="elite-card rounded-3xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 mb-4">Analysis Summary</p>
                    <div className="space-y-0.5">
                      {[
                        { label: 'Duration',       value: r.duration_s ? `${Math.floor(r.duration_s)}s` : '--' },
                        { label: 'Resolution',     value: r.height ? `${r.height}p @ ${Math.round(r.fps || 0)} fps` : '--' },
                        { label: 'Fusion windows', value: String((r.fusion_insights || []).length) },
                        { label: 'Unique people',  value: String(distinctPeopleCount) },
                        { label: 'Fusion alerts',  value: String(fusionAlertsCount) },
                        { label: 'Avg confidence', value: avgConfidence > 0 ? `${avgConfidence}%` : '--' },
                      ].map(item => (
                        <div key={item.label} className="sys-metric-row">
                          <span className="text-[10px] text-gray-600">{item.label}</span>
                          <span className="text-[10px] font-bold text-cyan-400 font-mono">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Severity Distribution */}
                  <div className="elite-card rounded-3xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 mb-4">Event Severity</p>
                    {(() => {
                      const evts = r.surveillance_events || [];
                      const critical = evts.filter(e => e.severity === 'critical').length;
                      const high = evts.filter(e => e.severity === 'high').length;
                      const other = evts.length - critical - high;
                      const total = Math.max(evts.length, 1);
                      return (
                        <div className="space-y-3">
                          {[
                            { label: 'Critical', count: critical, fill: '#f43f5e', bg: 'rgba(244,63,94,.08)', border: 'rgba(244,63,94,.2)' },
                            { label: 'High',     count: high,     fill: '#fb923c', bg: 'rgba(251,146,60,.08)', border: 'rgba(251,146,60,.2)' },
                            { label: 'Other',    count: other,    fill: '#22d3ee', bg: 'rgba(34,211,238,.06)', border: 'rgba(34,211,238,.15)' },
                          ].map(s => (
                            <div key={s.label} className="rounded-xl p-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-semibold text-gray-400">{s.label}</span>
                                <span className="text-[10px] font-mono font-bold text-gray-300">{s.count}</span>
                              </div>
                              <div className="dist-bar-track">
                                <div className="dist-bar-fill" style={{ width: `${(s.count / total) * 100}%`, background: s.fill, boxShadow: `0 0 8px ${s.fill}88` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}

              {/* Intelligence Brief */}
              {r && (r as any).ai_brief && (
                <motion.div
                  className="intel-brief p-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-cyan-400" aria-hidden />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">AI Intelligence Brief</p>
                    <span className="ml-auto text-[9px] font-mono text-gray-600 border border-white/10 bg-white/[0.03] px-2 py-0.5 rounded">Claude Multiagent</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{(r as any).ai_brief}</p>
                  {currentJobId && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-end">
                      <Link to={`/analyze/results/${currentJobId}`} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                        Read full intelligence report <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Analytics Panel */}
              <div className="elite-card rounded-3xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h4 className="elite-label flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5" /> Intelligence Analytics
                  </h4>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {r ? `${(r.fusion_insights || []).length} fusion windows · ${(r.frame_analytics || []).length} frames` : 'No data loaded'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
                  <div className="p-6 space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Track Density Over Time
                    </h5>
                    <div className="h-44 relative w-full">
                      <canvas id="density-chart"></canvas>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 flex items-center gap-2">
                      <Brain className="w-3 h-3" /> Anomaly Fusion Score
                    </h5>
                    <div className="h-44 relative w-full">
                      <canvas id="anomaly-chart"></canvas>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intelligence Layers — tabbed: Events | Audio | Speech */}
              <div className="elite-card rounded-3xl overflow-hidden border border-white/[0.08]">
                {/* Tab header */}
                <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="elite-label flex items-center gap-2">Intelligence Layers</h4>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/[0.07] self-start sm:self-auto flex-wrap">
                    {([
                      { id: 'events'  as const, label: 'Events',      count: eventsCount },
                      { id: 'audio'   as const, label: 'Audio',       count: ((r as any)?.audio_events || []).length },
                      { id: 'speech'  as const, label: 'Speech',      count: speechCount },
                    ]).map(t => (
                      <button key={t.id} type="button" onClick={() => setIntelTab(t.id)} className={`intel-tab ${intelTab === t.id ? 'intel-tab--on' : ''}`}>
                        {t.label}
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${intelTab === t.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.07] text-gray-600'}`}>{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* — Events tab — */}
                {intelTab === 'events' && (
                  <>
                    <div className="px-6 py-3 border-b border-white/[0.05] bg-black/10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" aria-hidden />
                        <input type="text" value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Filter events by type or description..." className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-8 py-2.5 text-xs text-gray-300 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 placeholder:text-gray-600 transition-all" />
                        {eventSearch && (
                          <button type="button" onClick={() => setEventSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors" aria-label="Clear filter">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-separate border-spacing-0 analyzer-table">
                        <thead>
                          <tr className="bg-white/[0.04] backdrop-blur-md">
                            {['Time', 'Severity', 'Classification', 'Description', 'Conf'].map((h, i) => (
                              <th key={h} className={`px-6 py-3 border-b border-white/[0.08] text-slate-500 uppercase font-bold tracking-wider ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredEvents.length === 0 ? (
                            <tr><td colSpan={5} className="py-16 text-center text-slate-600 italic">{eventsCount === 0 ? 'No anomalies detected — select a completed job.' : 'No events match your filter.'}</td></tr>
                          ) : filteredEvents.map((e, idx) => {
                            const conf = Math.round(e.confidence * 100);
                            const isCrit = e.severity === 'critical';
                            const isHigh = e.severity === 'high';
                            return (
                              <tr key={idx} className={`transition-colors group ${isCrit ? 'event-row-critical' : isHigh ? 'event-row-high' : idx % 2 === 0 ? 'bg-white/[0.01]' : ''} hover:bg-white/[0.04]`}>
                                <td className="px-6 py-3 font-mono text-cyan-400 font-bold">{fmtTime(e.timestamp_s)}</td>
                                <td className="px-6 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isCrit ? 'bg-rose-500/20 text-rose-400' : isHigh ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/15 text-yellow-400'}`}>{e.severity}</span>
                                </td>
                                <td className="px-6 py-3 font-semibold text-slate-200 capitalize">{e.event_type.replace(/_/g, ' ')}</td>
                                <td className="px-6 py-3 text-slate-400 group-hover:text-slate-200 transition-colors max-w-xs truncate">{e.description}</td>
                                <td className="px-6 py-3 min-w-[80px]">
                                  <div className="text-right font-mono text-slate-400">{conf}%</div>
                                  <div className="conf-bar-wrap"><div className="conf-bar-fill" style={{ width: `${conf}%`, background: conf > 80 ? 'rgba(244,63,94,.65)' : conf > 60 ? 'rgba(251,146,60,.55)' : 'rgba(34,211,238,.45)' }} /></div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* — Audio Events tab — */}
                {intelTab === 'audio' && (
                  <div className="p-6 space-y-2 max-h-80 overflow-y-auto analyzer-scroll">
                    {((r as any)?.audio_events || []).length === 0 ? (
                      <p className="text-center text-slate-600 italic text-xs py-12">No audio events detected in this analysis.</p>
                    ) : (
                      ((r as any).audio_events as Array<{ label?: string; event_label?: string; confidence: number; timestamp_s?: number; onset?: number }>).map((a, i) => (
                        <div key={i} className="audio-event-row">
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex-shrink-0">
                            <div className="audio-vis">
                              {[6, 13, 8, 15, 10].map((h, j) => <div key={j} className="audio-bar" style={{ height: `${h}px` }} />)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 capitalize">{(a.label || a.event_label || 'Audio event').replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-gray-600 font-mono mt-0.5">{a.timestamp_s != null ? fmtTime(a.timestamp_s) : a.onset != null ? fmtTime(a.onset) : '--'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-mono text-sky-400">{Math.round(a.confidence * 100)}%</div>
                            <div className="conf-bar-wrap w-16 mt-1"><div className="conf-bar-fill" style={{ width: `${Math.round(a.confidence * 100)}%`, background: 'rgba(56,189,248,.6)' }} /></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* — Speech Transcript tab — */}
                {intelTab === 'speech' && (
                  <div className="p-5 space-y-2 max-h-96 overflow-y-auto analyzer-scroll">
                    {(r?.speech_segments || []).filter(s => !s.is_noise).length === 0 ? (
                      <p className="text-center text-slate-600 italic text-xs py-12">No speech detected in this analysis.</p>
                    ) : (
                      (r?.speech_segments || []).filter(s => !s.is_noise).map((seg, i) => (
                        <div key={i} className="transcript-line">
                          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-cyan-400/80 font-bold shrink-0">
                              {fmtTime((seg as any).start ?? 0)} → {fmtTime((seg as any).end ?? 0)}
                            </span>
                            {(seg as any).speaker && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">{(seg as any).speaker}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">{(seg as any).text || '[inaudible]'}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            {r && (
              <motion.div
                layout
                className="elite-card overflow-hidden border border-cyan-500/15"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Video info strip */}
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-3 bg-cyan-500/[0.03]">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold truncate text-white">{r.video_name}</h2>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                      {Math.floor(r.duration_s || 0)}s · {r.height}p @ {Math.round(r.fps || 0)} fps · {eventsCount} events · {distinctPeopleCount} people
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                    risk === 'CRITICAL' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' :
                    risk === 'HIGH'     ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' :
                                         'bg-cyan-500/12 border-cyan-500/25 text-cyan-400'
                  }`}>{risk}</span>
                </div>
                {/* Actions */}
                <div className="p-4 flex flex-wrap gap-2">
                  <Link to={`/analyze/results/${currentJobId}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/12 hover:bg-cyan-500/22 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition-all min-h-[40px]">
                    <Brain className="w-3.5 h-3.5" /> Full Intelligence Report
                  </Link>
                  <button type="button" onClick={handleDownloadReport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 border border-white/15 font-semibold text-xs transition-all min-h-[40px]">
                    <FileText className="w-3.5 h-3.5" /> PDF Report
                  </button>
                  <a href={getExportCsvUrl(currentJobId!)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 border border-white/15 font-semibold text-xs transition-all min-h-[40px]" download>
                    <Download className="w-3.5 h-3.5" /> CSV Data
                  </a>
                  <button type="button" onClick={handleDownloadVideo} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl brand-bg-gradient text-slate-900 font-bold text-xs transition-all shadow-lg shadow-cyan-500/15 min-h-[40px] ml-auto">
                    <Download className="w-3.5 h-3.5" /> Labeled Video
                  </button>
                </div>
              </motion.div>
            )}

              {alertsFeed.length > 0 && (
                <AnalyzerSection title="Live insights" icon={Bell}>
                  <div className="max-h-64 space-y-2 overflow-y-auto analyzer-scroll pr-1">
                    {alertsFeed.map((e) => (
                      <div
                        key={e.id}
                        className={`analyzer-insight-card alert-new ${e.isCrit ? 'analyzer-insight-card--critical' : 'analyzer-insight-card--warn'}`}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.isCrit ? 'bg-rose-400' : 'bg-amber-400'} shadow-[0_0_6px_currentColor]`} aria-hidden />
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${e.isCrit ? 'text-rose-400' : 'text-amber-400'}`}>
                              {e.event_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="analyzer-mono text-[10px] text-gray-600 shrink-0">{e.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-300 pl-3.5">{e.description}</p>
                      </div>
                    ))}
                  </div>
                </AnalyzerSection>
              )}
            </div>
          </section>
          </div>

          <div id="job-library-panel">
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

        </div>
      </motion.div>
    </>
  );
}
