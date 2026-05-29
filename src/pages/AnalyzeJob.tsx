import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, AlertTriangle, ArrowLeft,
  Video, Cpu, PersonStanding, Mic, Volume2, Brain, Sparkles, ShieldAlert,
  Clock, Zap, TrendingUp, Terminal,
} from 'lucide-react';
import { getJobStatus, getJobResult, getWsUrl, cancelJob, retryJob, JobStatus, isValidJobId, getJobErrorMessage } from '../lib/detectraApi';
import { loadJobAnalysisResult } from '../lib/loadJobResult';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { updateVideoUpload } from '../lib/supabaseDb';
import { persistJobToUserLibrary } from '../lib/jobPersistence';
import { addLocalJob, getLocalJobs } from '../lib/localJobSession';
import { userCanAccessJob } from '../lib/userJobAccess';
import { friendlyStage } from '../lib/userFacing';
import UserBanner from '../components/ui/UserBanner';

// ── Log level types ──────────────────────────────────────────────────────────

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'ai' | 'data';

interface LogEntry { time: string; msg: string; level: LogLevel; }

function detectLogLevel(msg: string): LogLevel {
  const m = msg.toLowerCase();
  if (/error|fail|cancel|crash/.test(m))                                                   return 'error';
  if (/complete|done|finish|success|100%|opening results/.test(m))                         return 'success';
  if (/warn|slow|retry|timeout/.test(m))                                                   return 'warning';
  if (/percep|yolo|fusion|whisper|audio|speech|neural|ai model|loading ai|surveillance|post.process/.test(m)) return 'ai';
  if (/video|frame|read|write|report|output|rag|json/.test(m))                             return 'data';
  return 'info';
}

const LOG_COLORS: Record<LogLevel, string> = {
  info:    'text-cyan-300',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-red-400',
  ai:      'text-purple-400',
  data:    'text-blue-400',
};

const LOG_BADGES: Record<LogLevel, string> = {
  info:    'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  error:   'bg-red-500/15 text-red-400 border-red-500/20',
  ai:      'bg-purple-500/15 text-purple-400 border-purple-500/20',
  data:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  info:    'INFO',
  success: 'DONE',
  warning: 'WARN',
  error:   'ERR ',
  ai:      'AI  ',
  data:    'DATA',
};

// ── Pipeline stages ──────────────────────────────────────────────────────────

interface Stage {
  key:   string;
  label: string;
  sub:   string;
  Icon:  React.FC<{ className?: string }>;
  grad:  string;
  glow:  string;
}

const STAGES: Stage[] = [
  { key: 'loading_models',  label: 'Loading AI Models',     sub: 'YOLOv8 · Whisper · Fusion',        Icon: Cpu,            grad: 'from-purple-500 to-indigo-500',  glow: 'rgba(139,92,246,0.5)'  },
  { key: 'reading_video',   label: 'Reading Video',         sub: 'Metadata · Frame extraction',      Icon: Video,          grad: 'from-blue-500 to-cyan-500',      glow: 'rgba(59,130,246,0.5)'  },
  { key: 'perception',      label: 'Visual Perception',     sub: 'YOLOv8s-seg · ByteTrack · Pose',   Icon: PersonStanding, grad: 'from-cyan-500 to-blue-600',      glow: 'rgba(34,211,238,0.5)'  },
  { key: 'speech',          label: 'Speech Recognition',    sub: 'Whisper-small · Language detect',  Icon: Mic,            grad: 'from-green-500 to-emerald-600',  glow: 'rgba(34,197,94,0.5)'   },
  { key: 'audio',           label: 'Audio Classification',  sub: 'YAMNet · MFCC · 521 categories',  Icon: Volume2,        grad: 'from-yellow-500 to-amber-500',   glow: 'rgba(234,179,8,0.5)'   },
  { key: 'fusion',          label: 'Multimodal Fusion',     sub: 'Cross-attention transformer',      Icon: Brain,          grad: 'from-pink-500 to-rose-600',      glow: 'rgba(236,72,153,0.5)'  },
  { key: 'surveillance',    label: 'Surveillance Analysis', sub: 'Event detection · Threat scoring', Icon: ShieldAlert,    grad: 'from-orange-500 to-red-500',     glow: 'rgba(249,115,22,0.5)'  },
  { key: 'postprocessing',  label: 'Post-Processing',       sub: 'Validation · RAG JSON · Report',   Icon: Sparkles,       grad: 'from-teal-500 to-cyan-600',      glow: 'rgba(20,184,166,0.5)'  },
];

// Per-segment gradient stop colors aligned with STAGES above
const SEG_COLORS: Array<[string, string]> = [
  ['#8b5cf6', '#6366f1'],
  ['#3b82f6', '#06b6d4'],
  ['#06b6d4', '#2563eb'],
  ['#22c55e', '#059669'],
  ['#eab308', '#f59e0b'],
  ['#ec4899', '#e11d48'],
  ['#f97316', '#ef4444'],
  ['#14b8a6', '#0891b2'],
];

const STAGE_MAP: Record<string, number> = {
  queued:             0,
  initializing:       0,
  loadingyoloseg:     0,
  loadingyolopose:    0,
  modelsready:        0,
  loadingmodels:      0,
  readingvideo:       1,
  startinganalysis:   1,
  perception:         2,
  speech:             3,
  speechaudio:        3,
  audio:              4,
  fusion:             5,
  surveillance:       6,
  postprocessing:     7,
  validation:         7,
  writingoutput:      7,
  identityreasoning:  7,
  writingvideo:       8,
  writingreport:      8,
  writingragjson:     8,
  completed:          9,
};

function stageIndex(stage: string): number {
  if (!stage) return -1;
  const key = stage.toLowerCase().replace(/[_\s]/g, '');
  return STAGE_MAP[key] ?? 0;
}

function normalizeJob(j: JobStatus | null): JobStatus | null {
  if (!j) return null;
  if (j.status === 'completed' || j.has_result || j.progress >= 100) {
    return { ...j, status: 'completed', progress: 100, stage: j.stage || 'completed' };
  }
  return j;
}

function isJobDone(j: Partial<JobStatus>): boolean {
  return j.status === 'completed' || !!j.has_result || (j.progress ?? 0) >= 100;
}

function isJobFailed(j: Partial<JobStatus>): boolean {
  return j.status === 'failed';
}

function mergeJobUpdate(prev: JobStatus | null, raw: Partial<JobStatus>): JobStatus {
  const next = prev ? ({ ...prev, ...raw } as JobStatus) : (raw as JobStatus);
  const progress = Math.max(prev?.progress ?? 0, raw.progress ?? 0);
  const stage =
    progress > (prev?.progress ?? 0)
      ? raw.stage || prev?.stage || next.stage
      : prev?.stage || raw.stage || next.stage;
  return normalizeJob({ ...next, progress, stage }) ?? { ...next, progress, stage };
}

// ── Segmented Donut Progress Chart ───────────────────────────────────────────

function DonutProgress({
  progress, status, currentStageIdx, isDone, isFailed, currentStage,
}: {
  progress: number;
  status: string;
  currentStageIdx: number;
  isDone: boolean;
  isFailed: boolean;
  currentStage: Stage | null;
}) {
  const N = STAGES.length;
  const CX = 100, CY = 100;
  const R_OUT = 80, R_IN = 56;
  const GAP = 4;
  const SWEEP = 360 / N - GAP;
  const isRunning = status === 'running' || status === 'pending';

  function polar(r: number, deg: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  function segPath(startDeg: number): string {
    const endDeg = startDeg + SWEEP;
    const s1 = polar(R_OUT, startDeg), s2 = polar(R_OUT, endDeg);
    const e1 = polar(R_IN,  endDeg),  e2 = polar(R_IN,  startDeg);
    const lg = SWEEP > 180 ? 1 : 0;
    return [
      `M ${s1.x.toFixed(3)} ${s1.y.toFixed(3)}`,
      `A ${R_OUT} ${R_OUT} 0 ${lg} 1 ${s2.x.toFixed(3)} ${s2.y.toFixed(3)}`,
      `L ${e1.x.toFixed(3)} ${e1.y.toFixed(3)}`,
      `A ${R_IN} ${R_IN} 0 ${lg} 0 ${e2.x.toFixed(3)} ${e2.y.toFixed(3)}`,
      'Z',
    ].join(' ');
  }

  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto select-none">
      {isRunning && currentStage && (
        <div
          className="absolute inset-0 rounded-full opacity-15 animate-pulse pointer-events-none"
          style={{ boxShadow: `0 0 60px ${currentStage.glow}` }}
        />
      )}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={isDone ? 'Analysis complete' : isFailed ? 'Analysis failed' : `Analysis progress: ${Math.round(progress)}%`}
      >
        <defs>
          {SEG_COLORS.map(([c1, c2], i) => (
            <linearGradient key={i} id={`dg-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          ))}
        </defs>

        {/* Dark background ring */}
        <circle
          cx={CX} cy={CY}
          r={(R_OUT + R_IN) / 2}
          fill="none"
          stroke="#111827"
          strokeWidth={R_OUT - R_IN}
        />

        {/* Donut segments */}
        {STAGES.map((stage, idx) => {
          const done   = isDone || idx < currentStageIdx;
          const active = isRunning && idx === currentStageIdx;
          return (
            <path
              key={stage.key}
              d={segPath(idx * (360 / N))}
              fill={done ? '#22c55e' : active ? `url(#dg-${idx})` : '#1f2937'}
              opacity={done ? 0.85 : active ? 1 : 0.5}
              className={active ? 'animate-pulse' : ''}
              style={active ? { filter: `drop-shadow(0 0 6px ${stage.glow})` } : {}}
            />
          );
        })}

        {/* Center content */}
        {isDone ? (
          <>
            <text x={CX} y={CY + 6} textAnchor="middle" fill="#4ade80" fontSize="32" fontWeight="bold" fontFamily="system-ui,sans-serif">✓</text>
            <text x={CX} y={CY + 22} textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="system-ui,sans-serif" letterSpacing="1">COMPLETE</text>
          </>
        ) : isFailed ? (
          <>
            <text x={CX} y={CY + 6} textAnchor="middle" fill="#ef4444" fontSize="30" fontWeight="bold" fontFamily="system-ui,sans-serif">✗</text>
            <text x={CX} y={CY + 22} textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="system-ui,sans-serif" letterSpacing="1">FAILED</text>
          </>
        ) : (
          <>
            <text x={CX} y={CY + 9} textAnchor="middle" fill="white" fontSize="30" fontWeight="800" fontFamily="ui-monospace,monospace">{Math.round(progress)}</text>
            <text x={CX} y={CY + 24} textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="system-ui,sans-serif" letterSpacing="0.5">% COMPLETE</text>
          </>
        )}
      </svg>
    </div>
  );
}

// ── Info Chip ─────────────────────────────────────────────────────────────────

function InfoChip({ icon: Icon, label, value, color }: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 bg-white/8 rounded-xl border border-white/12">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="text-gray-500 text-xs leading-none">{label}</p>
        <p className="text-white text-sm font-semibold mt-0.5 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// ── Terminal Activity Log ─────────────────────────────────────────────────────

function TerminalLog({ log, wsConnected }: { log: LogEntry[]; wsConnected: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible   = log.slice(-60);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span className="elite-label mb-0">System Log</span>
        <div className="ml-auto flex items-center gap-2">
          {wsConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-[10px] font-mono font-bold tracking-widest">WS LIVE</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-amber-400 text-[10px] font-mono font-bold tracking-widest">POLLING</span>
            </>
          )}
        </div>
      </div>

      <div className="relative bg-[#03070f] rounded-xl border border-white/10 overflow-hidden shadow-inner">
        {/* Top fade */}
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#03070f] to-transparent pointer-events-none z-10" />

        {/* Scrollable log area */}
        <div
          ref={scrollRef}
          className="h-72 overflow-y-auto px-3 pt-2 pb-3 space-y-0.5 font-mono"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
        >
          <AnimatePresence initial={false}>
            {visible.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-700 text-xs">Waiting for pipeline to start…</p>
              </div>
            ) : (
              visible.map((entry, i) => (
                <motion.div
                  key={`${entry.time}|${entry.msg}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: i === visible.length - 1 ? 1 : 0.72, x: 0 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="flex items-baseline gap-2 py-0.5 min-w-0 group hover:opacity-100 transition-opacity"
                >
                  <span className="text-gray-700 flex-shrink-0 tabular-nums select-none text-[10px] w-20">{entry.time}</span>
                  <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-px rounded border ${LOG_BADGES[entry.level]}`}>
                    {LOG_LEVEL_LABELS[entry.level]}
                  </span>
                  <span className={`text-xs break-all leading-5 ${LOG_COLORS[entry.level]}`}>
                    {entry.msg}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Blinking cursor */}
          {visible.length > 0 && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-gray-700 text-[10px] select-none w-20 tabular-nums">{new Date().toLocaleTimeString()}</span>
              <span className="text-[9px] font-bold px-1.5 py-px rounded border bg-gray-900 text-gray-700 border-gray-800">SYS </span>
              <span className="w-1.5 h-3.5 bg-cyan-500/60 animate-pulse rounded-sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyzeJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [job, setJob]           = useState<JobStatus | null>(null);
  const [error, setError]       = useState('');
  const [log, setLog]           = useState<LogEntry[]>([]);
  const [elapsed, setElapsed]   = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showForceOpen, setShowForceOpen] = useState(false);
  const [liveStats, setLiveStats] = useState<{ persons?: number; events?: number; riskLevel?: string }>({});
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const wsRef               = useRef<WebSocket | null>(null);
  const wsPingRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsTimeoutRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const redirectedRef       = useRef(false);
  const lastLogKeyRef       = useRef('');
  const stalePollsRef       = useRef(0);
  const lastProgressRef     = useRef(-1);
  const clientProgressRef   = useRef(0);
  const highProgressSinceRef = useRef<number | null>(null);

  const appendLog = (msg: string, forceLevel?: LogLevel) => {
    if (lastLogKeyRef.current === msg) return;
    lastLogKeyRef.current = msg;
    const level = forceLevel ?? detectLogLevel(msg);
    setLog(prev => [...prev.slice(-149), { time: new Date().toLocaleTimeString(), msg, level }]);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const stopWs = () => {
    if (wsPingRef.current)  { clearInterval(wsPingRef.current);  wsPingRef.current  = null; }
    if (wsTimeoutRef.current) { clearTimeout(wsTimeoutRef.current); wsTimeoutRef.current = null; }
    if (wsRef.current)      { try { wsRef.current.close(); } catch { /* noop */ } wsRef.current = null; }
  };

  useEffect(() => {
    if (!jobId) return;
    if (!isValidJobId(jobId)) {
      setError('Invalid analysis ID. Please start a new analysis.');
      return;
    }
    redirectedRef.current       = false;
    lastLogKeyRef.current       = '';
    stalePollsRef.current       = 0;
    lastProgressRef.current     = -1;

    const finishAndRedirect = async () => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      stopPolling();
      stopWs();
      appendLog('Analysis complete — opening results');
      if (user && isSupabaseConfigured) {
        await persistJobToUserLibrary(user.id, jobId, { archiveLabeledVideo: true }).catch(() => {});
      }
      window.setTimeout(() => navigate(`/analyze/results/${jobId}`, { replace: true }), 600);
    };

    const tryFinalizeFromApi = async (hint?: Partial<JobStatus>) => {
      if (redirectedRef.current) return false;
      try {
        await getJobResult(jobId);
        onData({ ...hint, status: 'completed', progress: 100, has_result: true, stage: 'completed' });
        return true;
      } catch {
        if (user) {
          try {
            await loadJobAnalysisResult(jobId, user.id);
            onData({ ...hint, status: 'completed', progress: 100, has_result: true, stage: 'completed' });
            return true;
          } catch { /* not ready */ }
        }
        return false;
      }
    };

    const onData = (raw: Partial<JobStatus> & {
      type?: string;
      error?: string | null;
      persons?: number;
      surveillance_events?: number | unknown[];
      risk_level?: string;
      video_url?: string;
      queue_position?: number;
      message?: string;
    }) => {
      // ── Heartbeat — ignore silently ──────────────────────────────────────
      if (raw.type === 'pong') return;

      // ── Queue position broadcast ─────────────────────────────────────────
      if (raw.type === 'queued') {
        if (raw.queue_position != null) setQueuePosition(raw.queue_position);
        if (raw.message) appendLog(raw.message, 'info');
        return;
      }

      // ── Live stats — update from any message that carries them ───────────
      if (raw.persons !== undefined) setLiveStats(s => ({ ...s, persons: raw.persons }));
      if (raw.risk_level) setLiveStats(s => ({ ...s, riskLevel: raw.risk_level }));
      // surveillance_events is sent as an integer count in completed messages
      if (raw.surveillance_events != null) {
        const count = typeof raw.surveillance_events === 'number'
          ? raw.surveillance_events
          : Array.isArray(raw.surveillance_events)
            ? (raw.surveillance_events as unknown[]).length
            : undefined;
        if (count !== undefined) setLiveStats(s => ({ ...s, events: count }));
      }

      // ── Completed ────────────────────────────────────────────────────────
      if (raw.type === 'completed') {
        setQueuePosition(null);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type: _t, queue_position: _qp, message: _msg, ...rest } = raw;
        onData({
          ...rest,
          status: 'completed', progress: 100, has_result: true, has_report: true,
          has_video: Boolean(raw.video_url ?? true),
          stage: 'completed',
        });
        return;
      }

      // ── Strip WS-only fields before merging into job state ───────────────
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type: _type, queue_position: _qpos, message: _msg2, video_url: _vu, ...jobFields } = raw;

      setJob((prev) => {
        const merged = mergeJobUpdate(prev, jobFields);
        clientProgressRef.current = merged.progress ?? 0;
        const stage    = merged.stage;
        const progress = merged.progress ?? 0;

        if (progress >= 84) {
          if (highProgressSinceRef.current == null) highProgressSinceRef.current = Date.now();
        } else {
          highProgressSinceRef.current = null;
        }

        // Only log meaningful stage transitions (skip 'state' hydration noise)
        if (stage && raw.type !== 'state') {
          appendLog(`${friendlyStage(stage)} — ${Math.round(progress)}%`);
        }

        if (isJobDone(merged)) {
          setQueuePosition(null);
          queueMicrotask(finishAndRedirect);
        } else if (isJobFailed(merged)) {
          setQueuePosition(null);
          queueMicrotask(() => {
            stopPolling(); stopWs();
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            appendLog(`Error: ${merged.error || 'Unknown failure'}`, 'error');
            if (user && isSupabaseConfigured) {
              updateVideoUpload(user.id, jobId, { status: 'failed' }).catch(() => {});
            }
          });
        }
        return merged;
      });
    };

    const poll = async () => {
      if (redirectedRef.current) return;
      try {
        const d = await getJobStatus(jobId);
        const progress       = d.progress ?? 0;
        const clientProgress = clientProgressRef.current;
        const effective      = Math.max(progress, clientProgress);

        if ((d.status === 'running' || d.status === 'pending') && progress === lastProgressRef.current && effective >= 80) {
          stalePollsRef.current += 1;
        } else {
          stalePollsRef.current  = 0;
          lastProgressRef.current = progress;
        }

        if (stalePollsRef.current >= 2 && effective >= 80) {
          if (await tryFinalizeFromApi(d)) return;
        }
        if (effective >= 84 && clientProgress >= 84) {
          const since = highProgressSinceRef.current;
          if (since) {
            const elapsed = Date.now() - since;
            if (elapsed >= 12_000 && await tryFinalizeFromApi(d)) return;
            if (elapsed >= 180_000) setShowForceOpen(true);
          }
        }

        onData({ ...d, progress: effective });
        if (isJobDone(d) || isJobFailed(d)) stopPolling();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    const startPolling = () => {
      if (pollRef.current) return;
      void poll();
      pollRef.current = setInterval(poll, 2000);
    };

    const resetWsTimeout = (ws: WebSocket) => {
      if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
      wsTimeoutRef.current = setTimeout(() => ws.close(), 45_000);
    };

    const tryWs = async () => {
      try {
        const url = await getWsUrl(jobId);
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onopen = () => {
          setWsConnected(true);
          appendLog('WebSocket connected — real-time streaming active', 'info');
          resetWsTimeout(ws);
          wsPingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
          }, 10_000);
        };
        ws.onmessage = (e) => {
          resetWsTimeout(ws);
          try {
            onData(JSON.parse(e.data));
          } catch (err) {
            console.warn('[AnalyzeJob] WS parse error:', err);
            appendLog('WebSocket message could not be parsed — stream may be degraded', 'warning');
          }
        };
        ws.onerror  = () => ws.close();
        ws.onclose  = () => {
          setWsConnected(false);
          if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
          if (wsPingRef.current)  { clearInterval(wsPingRef.current); wsPingRef.current = null; }
        };
      } catch { /* polling is source of truth */ }
    };

    const startTracking = async () => {
      if (user) {
        const allowed =
          (await userCanAccessJob(user.id, jobId)) ||
          getLocalJobs().some((e) => e.job_id === jobId);
        if (!allowed) {
          setError('You do not have access to this analysis. It may belong to another account.');
          return;
        }
      }

      // Retry up to 5 times with 2s back-off for transient server/network errors
      // (e.g. backend restarting mid-analysis). Don't retry 404 / access errors.
      const MAX_RETRIES = 5;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const d = await getJobStatus(jobId);
          const normalized = normalizeJob(d);
          setJob(normalized ?? d);
          addLocalJob(jobId, d.video_name);
          if (normalized && isJobDone(normalized)) { finishAndRedirect(); return; }
          if (d.status === 'failed') return;
          startPolling();
          tryWs();
          return;  // success
        } catch (e: unknown) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : String(e);
          // Don't retry 404 / auth / access errors — those are permanent
          if (
            msg.includes('404') ||
            msg.toLowerCase().includes('not found') ||
            msg.toLowerCase().includes('access') ||
            msg.includes('403')
          ) {
            setError(getJobErrorMessage(e, jobId));
            return;
          }
          if (attempt < MAX_RETRIES - 1) {
            appendLog(`Server unavailable — retrying in 3s (attempt ${attempt + 1}/${MAX_RETRIES})`, 'warning');
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }
      setError(getJobErrorMessage(lastErr, jobId));
    };

    void startTracking();
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { stopWs(); stopPolling(); if (timerRef.current) clearInterval(timerRef.current); };
  }, [jobId, navigate, user]);

  const displayJob      = job ? normalizeJob(job) ?? job : null;
  const status          = displayJob?.status ?? 'pending';
  const progress        = displayJob?.progress ?? 0;

  // When a job is marked "failed", the stored stage may be "failed" which maps
  // to index 0 — wrong. Fall back to estimating the last reached stage from
  // progress so green checkmarks still show for completed stages.
  const currentStageIdx = (() => {
    if (status === 'completed') return STAGES.length;
    if (!displayJob) return -1;
    const si = stageIndex(displayJob.stage);
    if (si > 0) return si;
    if (displayJob.status === 'failed') {
      const pct = displayJob.progress ?? 0;
      if (pct >= 88) return 7;
      if (pct >= 80) return 6;
      if (pct >= 73) return 5;
      if (pct >= 58) return 3;
      if (pct >= 10) return 2;
      if (pct >= 9)  return 1;
      return 0;
    }
    return si;
  })();
  const currentStage    = currentStageIdx >= 0 && currentStageIdx < STAGES.length ? STAGES[currentStageIdx] : null;
  const etaSecs         =
    displayJob && progress > 0 && (status === 'running' || status === 'pending')
      ? Math.round((elapsed / progress) * (100 - progress))
      : null;
  const fmtElapsed = `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  const isRunning  = status === 'running' || status === 'pending';
  const isDone     = status === 'completed';
  const isFailed   = status === 'failed';

  return (
    <motion.div className="min-h-[calc(100vh-5rem)] bg-transparent pt-20 sm:pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analyzer
        </Link>

        {isRunning && (
          <div className="mb-5 flex items-start gap-3">
            <div className="flex-1">
              <UserBanner variant="info">
                {queuePosition != null && queuePosition > 1
                  ? <p>Job is queued at position <strong className="text-white">{queuePosition}</strong> — waiting for an analysis slot. You will be redirected to results automatically when finished.</p>
                  : <p>Analysis can take several minutes for longer videos. You will be redirected to results automatically when finished.</p>}
              </UserBanner>
            </div>
            {jobId && showForceOpen && (
              <button
                onClick={() => navigate(`/analyze/results/${jobId}`, { replace: true })}
                className="flex-shrink-0 mt-0.5 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-medium transition-colors"
              >
                Force open results
              </button>
            )}
            {jobId && (
              <button
                disabled={cancelling}
                onClick={async () => {
                  if (!jobId || cancelling) return;
                  if (!window.confirm('Cancel this analysis? This cannot be undone.')) return;
                  setCancelling(true);
                  try {
                    await cancelJob(jobId);
                    setError('Analysis cancelled.');
                  } catch {
                    setError('Failed to cancel — the job may have already completed.');
                  } finally {
                    setCancelling(false);
                  }
                }}
                className="flex-shrink-0 mt-0.5 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-xs font-medium transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            )}
          </div>
        )}

        {error ? (
          <div className="text-center py-16 px-4 max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">
              {error.toLowerCase().includes('not found') || error.includes('404')
                ? 'Analysis not found'
                : error.toLowerCase().includes('server') || error.includes('500') || error.toLowerCase().includes('unavailable')
                  ? 'Server error'
                  : error.toLowerCase().includes('access') || error.includes('403')
                    ? 'Access denied'
                    : 'Something went wrong'}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {error.toLowerCase().includes('internal server error') || error.includes('500')
                ? 'The analysis server encountered an error. This can happen when the server restarted mid-analysis. Try again below.'
                : error}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {jobId && !error.includes('404') && !error.toLowerCase().includes('not found') && (
                <button
                  type="button"
                  disabled={retrying}
                  onClick={async () => {
                    if (!jobId || retrying) return;
                    setRetrying(true);
                    try {
                      await retryJob(jobId);
                      setError('');
                      setLog([]);
                      setElapsed(0);
                      setJob(null);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Retry failed — please re-upload the video.');
                    } finally {
                      setRetrying(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {retrying ? (
                    <><span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />Retrying…</>
                  ) : 'Retry Analysis'}
                </button>
              )}
              <Link to="/analyze">
                <button type="button" className="px-5 py-2.5 rounded-xl bg-white/6 border border-white/12 text-gray-300 hover:bg-white/10 text-sm font-medium transition-colors">
                  New Analysis
                </button>
              </Link>
            </div>
          </div>
        ) : !displayJob ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading job…</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── Main analysis card ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`elite-card p-5 sm:p-7 transition-colors duration-500 ${
                isRunning ? 'border-cyan-500/20'
                : isDone   ? 'border-emerald-500/25'
                : isFailed ? 'border-red-500/25'
                : ''
              }`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <p className="elite-label mb-1">
                    {isRunning ? 'Analysis in progress' : isDone ? 'Analysis complete' : 'Analysis failed'}
                  </p>
                  <h1 className="text-lg font-bold text-white truncate sm:text-xl">{displayJob.video_name}</h1>
                  <p className="text-gray-600 text-xs mt-0.5 font-mono truncate">{displayJob.job_id}</p>
                </div>
                {currentStage && isRunning && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 flex-shrink-0 bg-gradient-to-r ${currentStage.grad} bg-opacity-10`}
                  >
                    <currentStage.Icon className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-xs font-medium hidden sm:inline">{currentStage.label}</span>
                  </div>
                )}
              </div>

              {/* Two-column layout: donut chart + pipeline stages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">

                {/* Left — Donut chart */}
                <div className="flex flex-col items-center">
                  <DonutProgress
                    progress={progress}
                    status={status}
                    currentStageIdx={currentStageIdx}
                    isDone={isDone}
                    isFailed={isFailed}
                    currentStage={currentStage}
                  />
                  <div className="mt-3 text-center min-h-[2.5rem]">
                    {isRunning ? (
                      <>
                        <p className="text-white font-semibold text-sm">
                          {friendlyStage(displayJob.stage || 'initializing')}
                        </p>
                        {currentStage && (
                          <p className="text-gray-500 text-xs mt-0.5">{currentStage.sub}</p>
                        )}
                      </>
                    ) : isDone ? (
                      <p className="text-emerald-400 font-semibold text-sm">Opening results…</p>
                    ) : isFailed ? (
                      <p className="text-red-400 font-semibold text-sm">Analysis failed</p>
                    ) : null}
                  </div>
                </div>

                {/* Right — Pipeline stage list */}
                <div className="space-y-1">
                  {STAGES.map((stage, idx) => {
                    const done       = isDone || idx < currentStageIdx;
                    const active     = isRunning && idx === currentStageIdx;
                    const failedHere = isFailed && idx === currentStageIdx;
                    const pend       = !done && !active && !failedHere;
                    return (
                      <div
                        key={stage.key}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                          active      ? 'bg-white/10 border border-white/15'
                          : failedHere ? 'bg-red-500/10 border border-red-500/25'
                          : done       ? 'bg-white/4'
                          : 'opacity-45'
                        }`}
                      >
                        {/* Stage icon */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            done        ? 'bg-green-500/20'
                            : failedHere ? 'bg-red-500/20'
                            : active     ? `bg-gradient-to-br ${stage.grad}`
                            : 'bg-white/8'
                          }`}
                          style={active ? { boxShadow: `0 0 10px ${stage.glow}` } : {}}
                        >
                          {done
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            : failedHere
                              ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                              : <stage.Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-600'}`} />}
                        </div>

                        {/* Label */}
                        <span className={`flex-1 text-xs font-medium min-w-0 truncate ${
                          done        ? 'text-green-400'
                          : failedHere ? 'text-red-400'
                          : active     ? 'text-white'
                          : 'text-gray-600'
                        }`}>
                          {stage.label}
                        </span>

                        {/* Status indicator */}
                        {active && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-cyan-400 text-xs hidden sm:inline">running</span>
                          </span>
                        )}
                        {failedHere && (
                          <span className="text-red-400/70 text-xs flex-shrink-0 hidden sm:inline">failed</span>
                        )}
                        {pend && (
                          <span className="text-gray-700 text-xs tabular-nums flex-shrink-0">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats chips */}
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/8">
                <InfoChip icon={Clock} label="Elapsed" value={fmtElapsed} color="text-gray-400" />
                {etaSecs !== null && etaSecs > 0 && isRunning && (
                  <InfoChip
                    icon={TrendingUp}
                    label="Est. remaining"
                    value={etaSecs >= 60 ? `${Math.floor(etaSecs / 60)}m ${etaSecs % 60}s` : `${etaSecs}s`}
                    color="text-cyan-400"
                  />
                )}
                {isRunning && (
                  <InfoChip
                    icon={Zap}
                    label="Stage"
                    value={`${Math.min(currentStageIdx + 1, STAGES.length)} / ${STAGES.length}`}
                    color="text-purple-400"
                  />
                )}
              </div>

              {isRunning && progress >= 85 && (
                <div className="mt-4 text-center">
                  <Link to={`/analyze/results/${jobId}`}>
                    <button type="button" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline transition-colors">
                      Results ready? Open now →
                    </button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* ── Live intelligence feed (visible while running) ──────────── */}
            <AnimatePresence>
              {isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: 0.12 }}
                  className="elite-card p-4 border-purple-500/15 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-70" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                    </div>
                    <span className="text-gray-400 text-[10px] font-mono uppercase tracking-widest">Live Intelligence Feed</span>
                    {wsConnected && (
                      <span className="ml-auto text-[9px] font-mono text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 tracking-wider">
                        WebSocket Active
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/6">
                      <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-1.5">Persons</p>
                      <p className="text-white font-bold text-2xl tabular-nums font-mono">
                        {liveStats.persons !== undefined ? liveStats.persons : <span className="text-gray-700">—</span>}
                      </p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/6">
                      <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-1.5">Events</p>
                      <p className="text-white font-bold text-2xl tabular-nums font-mono">
                        {liveStats.events !== undefined ? liveStats.events : <span className="text-gray-700">—</span>}
                      </p>
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/6">
                      <p className="text-gray-600 text-[9px] uppercase tracking-widest mb-1.5">Risk</p>
                      <p className={`font-bold text-xl uppercase font-mono ${
                        liveStats.riskLevel === 'CRITICAL' ? 'text-red-400' :
                        liveStats.riskLevel === 'HIGH'     ? 'text-orange-400' :
                        liveStats.riskLevel === 'MODERATE' ? 'text-amber-400' :
                        liveStats.riskLevel                ? 'text-cyan-400'   : 'text-gray-700'
                      }`}>
                        {liveStats.riskLevel || '—'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Terminal activity log ───────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="elite-card p-5"
            >
              <TerminalLog log={log} wsConnected={wsConnected} />
            </motion.div>

            {/* ── Error detail card ───────────────────────────────────────── */}
            {isFailed && displayJob && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/8 border border-red-500/25 rounded-2xl p-5"
              >
                <p className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {currentStageIdx >= 7
                    ? 'Output generation failed — AI analysis completed'
                    : currentStageIdx >= 5
                      ? 'Pipeline failed at late stage'
                      : 'Analysis pipeline failed'}
                </p>

                {displayJob.error ? (
                  <p className="text-red-400/70 text-sm font-mono break-all bg-black/30 rounded-xl p-3 mb-3">
                    {displayJob.error}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                    {currentStageIdx >= 7
                      ? 'All AI analysis stages completed successfully. The failure occurred while writing output files (labeled video, HTML report). The core analysis data is intact — retry to regenerate.'
                      : currentStageIdx >= 5
                        ? `Failed at the ${STAGES[currentStageIdx]?.label ?? 'post-processing'} stage. This is usually a transient issue — retry below.`
                        : 'The analysis pipeline did not complete. This may have been caused by a server restart or a resource constraint. Retry below.'}
                  </p>
                )}

                {displayJob.progress != null && displayJob.progress > 0 && (
                  <p className="text-gray-600 text-xs mb-4 font-mono">
                    Reached {Math.round(displayJob.progress)}% — stage: {STAGES[currentStageIdx]?.label ?? displayJob.stage ?? 'unknown'}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {jobId && (
                    <button
                      type="button"
                      disabled={retrying}
                      onClick={async () => {
                        if (!jobId || retrying) return;
                        setRetrying(true);
                        try {
                          await retryJob(jobId);
                          setJob(null);
                          setLog([]);
                          setElapsed(0);
                          setError('');
                        } catch (e) {
                          setError(
                            e instanceof Error && e.message.includes('not found')
                              ? 'Original video no longer available — please re-upload the video to start a new analysis.'
                              : e instanceof Error ? e.message : 'Retry failed.'
                          );
                        } finally {
                          setRetrying(false);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {retrying ? (
                        <><span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />Re-running…</>
                      ) : (
                        currentStageIdx >= 7 ? 'Regenerate Output' : 'Retry Analysis'
                      )}
                    </button>
                  )}
                  <Link to="/analyze">
                    <button type="button" className="px-4 py-2.5 rounded-xl bg-white/6 border border-white/12 text-gray-300 hover:bg-white/10 text-sm font-medium transition-colors">
                      New Analysis
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── Completed card ──────────────────────────────────────────── */}
            <AnimatePresence>
              {isDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/8 border border-green-500/30 rounded-2xl p-6 text-center glow-green"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/15 flex items-center justify-center mb-4">
                    <CheckCircle className="w-9 h-9 text-green-400" />
                  </div>
                  <p className="text-green-300 font-bold text-xl mb-1">Analysis Complete</p>
                  <p className="text-gray-400 text-sm mb-5">All 8 pipeline stages finished successfully</p>
                  <Link to={`/analyze/results/${jobId}`}>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="btn-cyan"
                    >
                      View Full Results →
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}
      </div>
    </motion.div>
  );
}
