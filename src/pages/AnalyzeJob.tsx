import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, AlertTriangle, ArrowLeft,
  Video, Cpu, PersonStanding, Mic, Volume2, Brain, Sparkles, ShieldAlert,
  Clock, Zap, Eye, TrendingUp,
} from 'lucide-react';
import { getJobStatus, getJobResult, getWsUrl, JobStatus } from '../lib/detectraApi';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { updateVideoUpload } from '../lib/supabaseDb';
import { persistJobToUserLibrary } from '../lib/jobPersistence';
import { addLocalJob, getLocalJobs } from '../lib/localJobSession';
import { userCanAccessJob } from '../lib/userJobAccess';
import { friendlyStage } from '../lib/userFacing';
import UserBanner from '../components/ui/UserBanner';

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
  { key: 'loading_models',  label: 'Loading AI Models',     sub: 'YOLOv8 · Whisper · Fusion',       Icon: Cpu,           grad: 'from-purple-500 to-indigo-500',  glow: 'rgba(139,92,246,0.4)'  },
  { key: 'reading_video',   label: 'Reading Video',         sub: 'Metadata · Frame extraction',     Icon: Video,         grad: 'from-blue-500 to-cyan-500',      glow: 'rgba(59,130,246,0.4)'  },
  { key: 'perception',      label: 'Visual Perception',     sub: 'YOLOv8s-seg · ByteTrack · Pose',  Icon: PersonStanding,grad: 'from-cyan-500 to-blue-600',      glow: 'rgba(34,211,238,0.4)'  },
  { key: 'speech',          label: 'Speech Recognition',    sub: 'Whisper-small · Language detect', Icon: Mic,           grad: 'from-green-500 to-emerald-600',  glow: 'rgba(34,197,94,0.4)'   },
  { key: 'audio',           label: 'Audio Classification',  sub: 'YAMNet · MFCC · 521 categories', Icon: Volume2,       grad: 'from-yellow-500 to-amber-500',   glow: 'rgba(234,179,8,0.4)'   },
  { key: 'fusion',          label: 'Multimodal Fusion',     sub: 'Cross-attention transformer',     Icon: Brain,         grad: 'from-pink-500 to-rose-600',      glow: 'rgba(236,72,153,0.4)'  },
  { key: 'surveillance',    label: 'Surveillance Analysis', sub: 'Event detection · Threat scoring',Icon: ShieldAlert,   grad: 'from-orange-500 to-red-500',     glow: 'rgba(249,115,22,0.4)'  },
  { key: 'postprocessing',  label: 'Post-Processing',       sub: 'Validation · RAG JSON · Report',  Icon: Sparkles,      grad: 'from-teal-500 to-cyan-600',      glow: 'rgba(20,184,166,0.4)'  },
];

const STAGE_MAP: Record<string, number> = {
  queued:           0,
  initializing:     0,
  loadingyoloseg:   0,
  loadingyolopose:  0,
  modelsready:      0,
  loadingmodels:    0,
  readingvideo:     1,
  startinganalysis: 1,
  perception:       2,
  speech:           3,
  speechaudio:      3,
  audio:            4,
  fusion:           5,
  surveillance:     6,
  postprocessing:   7,
  validation:       7,
  writingoutput:    7,
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

// ── Circular progress ring ───────────────────────────────────────────────────

function ProgressRing({ progress, status, currentStage }: { progress: number; status: string; currentStage: Stage | null }) {
  const R = 72;
  const C = 2 * Math.PI * R;
  const dash = (progress / 100) * C;

  const isError = status === 'failed';
  const isDone  = status === 'completed';
  const isRun   = status === 'running' || status === 'pending';

  return (
    <div className="relative w-40 h-40 sm:w-52 sm:h-52 mx-auto">
      {/* Outer glow ring when active */}
      {isRun && (
        <div
          className="absolute inset-0 rounded-full animate-pulse opacity-40"
          style={{ boxShadow: `0 0 40px ${currentStage?.glow ?? 'rgba(34,211,238,0.4)'}` }}
        />
      )}

      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle cx="80" cy="80" r={R} fill="none" stroke="#1f2937" strokeWidth="9" />
        {/* Progress arc */}
        {!isError && (
          <circle
            cx="80" cy="80" r={R}
            fill="none"
            stroke={isDone ? 'url(#done-grad)' : 'url(#prog-grad)'}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C - dash}`}
            className="transition-all duration-700"
          />
        )}
        {isError && (
          <circle cx="80" cy="80" r={R} fill="none" stroke="#ef4444" strokeWidth="9"
            strokeDasharray={`${C * 0.3} ${C * 0.7}`} />
        )}
        <defs>
          <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="done-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isDone ? (
          <CheckCircle className="w-12 h-12 text-green-400" />
        ) : isError ? (
          <AlertTriangle className="w-12 h-12 text-red-400" />
        ) : (
          <>
            <span className="text-4xl font-extrabold text-white tabular-nums">{Math.round(progress)}%</span>
            <span className="text-gray-500 text-xs mt-1">complete</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Live info chip ────────────────────────────────────────────────────────────

function InfoChip({ icon: Icon, label, value, color }: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2 bg-white/10 rounded-xl border border-white/20">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="text-gray-500 text-xs leading-none">{label}</p>
        <p className="text-white text-sm font-semibold mt-0.5 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AnalyzeJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [job, setJob]         = useState<JobStatus | null>(null);
  const [error, setError]     = useState('');
  const [log, setLog]         = useState<{ time: string; msg: string }[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const wsRef         = useRef<WebSocket | null>(null);
  const wsPingRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef     = useRef<HTMLDivElement>(null);
  const redirectedRef = useRef(false);
  const lastLogKeyRef = useRef('');
  const stalePollsRef = useRef(0);
  const lastProgressRef = useRef(-1);

  const appendLog = (msg: string) => {
    if (lastLogKeyRef.current === msg) return;
    lastLogKeyRef.current = msg;
    setLog(prev => [...prev.slice(-79), { time: new Date().toLocaleTimeString(), msg }]);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const stopWs = () => {
    if (wsPingRef.current) {
      clearInterval(wsPingRef.current);
      wsPingRef.current = null;
    }
    if (wsTimeoutRef.current) {
      clearTimeout(wsTimeoutRef.current);
      wsTimeoutRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* noop */ }
      wsRef.current = null;
    }
  };

  useEffect(() => {
    if (!jobId) return;
    redirectedRef.current = false;
    lastLogKeyRef.current = '';
    stalePollsRef.current = 0;
    lastProgressRef.current = -1;

    const finishAndRedirect = () => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      stopPolling();
      stopWs();
      appendLog('Analysis complete — opening results');
      if (user && isSupabaseConfigured) {
        void persistJobToUserLibrary(user.id, jobId, { archiveLabeledVideo: true });
      }
      window.setTimeout(() => {
        navigate(`/analyze/results/${jobId}`, { replace: true });
      }, 600);
    };

    const onData = (raw: Partial<JobStatus> & { type?: string; error?: string | null }) => {
      if (raw.type === 'completed') {
        const rest = { ...raw };
        delete (rest as { type?: string }).type;
        onData({
          ...rest,
          status: 'completed',
          progress: 100,
          has_result: true,
          has_report: true,
          has_video: Boolean((raw as { video_url?: string }).video_url ?? true),
          stage: 'completed',
        });
        return;
      }
      setJob((prev) => {
        const merged =
          normalizeJob(
            prev ? ({ ...prev, ...raw } as JobStatus) : (raw as JobStatus),
          ) ?? (prev ? ({ ...prev, ...raw } as JobStatus) : (raw as JobStatus));

        const stage = merged.stage;
        const progress = merged.progress ?? 0;
        if (stage) {
          appendLog(`${friendlyStage(stage)} — ${Math.round(progress)}%`);
        }

        if (isJobDone(merged)) {
          queueMicrotask(finishAndRedirect);
        } else if (isJobFailed(merged)) {
          queueMicrotask(() => {
            stopPolling();
            stopWs();
            appendLog(`Error: ${merged.error || 'Unknown failure'}`);
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
        const progress = d.progress ?? 0;

        if (
          (d.status === 'running' || d.status === 'pending') &&
          progress === lastProgressRef.current &&
          progress >= 80
        ) {
          stalePollsRef.current += 1;
        } else {
          stalePollsRef.current = 0;
          lastProgressRef.current = progress;
        }

        if (stalePollsRef.current >= 2 && progress >= 80) {
          try {
            await getJobResult(jobId);
            onData({ ...d, status: 'completed', progress: 100, has_result: true, stage: 'completed' });
            return;
          } catch {
            /* still writing outputs */
          }
        }

        onData(d);

        if (isJobDone(d) || isJobFailed(d)) {
          stopPolling();
        }
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
      wsTimeoutRef.current = setTimeout(() => {
        ws.close();
      }, 45_000);
    };

    const tryWs = () => {
      try {
        const ws = new WebSocket(getWsUrl(jobId));
        wsRef.current = ws;
        ws.onopen = () => {
          resetWsTimeout(ws);
          wsPingRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
          }, 10_000);
        };
        ws.onmessage = (e) => {
          resetWsTimeout(ws);
          try {
            onData(JSON.parse(e.data));
          } catch {
            /* ignore malformed frame */
          }
        };
        ws.onerror = () => ws.close();
        ws.onclose = () => {
          if (wsTimeoutRef.current) clearTimeout(wsTimeoutRef.current);
          if (wsPingRef.current) {
            clearInterval(wsPingRef.current);
            wsPingRef.current = null;
          }
        };
      } catch {
        /* polling is the source of truth */
      }
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

      try {
        const d = await getJobStatus(jobId);
        const normalized = normalizeJob(d);
        setJob(normalized ?? d);
        addLocalJob(jobId, d.video_name);
        if (normalized && isJobDone(normalized)) {
          finishAndRedirect();
          return;
        }
        if (d.status === 'failed') return;
        startPolling();
        tryWs();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Job not found';
        setError(
          msg.includes('403') || msg.toLowerCase().includes('access denied')
            ? 'You do not have access to this analysis.'
            : msg,
        );
      }
    };

    void startTracking();

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    return () => {
      stopWs();
      stopPolling();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, navigate, user]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  const displayJob = job ? normalizeJob(job) ?? job : null;
  const status = displayJob?.status ?? 'pending';
  const progress = displayJob?.progress ?? 0;
  const currentStageIdx =
    status === 'completed' ? STAGES.length : displayJob ? stageIndex(displayJob.stage) : -1;
  const currentStage =
    currentStageIdx >= 0 && currentStageIdx < STAGES.length ? STAGES[currentStageIdx] : null;
  const etaSecs =
    displayJob && progress > 0 && (status === 'running' || status === 'pending')
      ? Math.round((elapsed / progress) * (100 - progress))
      : null;
  const fmtElapsed = `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  const isRunning = status === 'running' || status === 'pending';
  const isDone = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div className="min-h-screen bg-transparent pt-20 sm:pt-24 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        <Link to="/analyze" className="inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Analyzer
        </Link>

        {isRunning && (
          <div className="mb-6">
            <UserBanner variant="info">
              <p>
                Analysis can take several minutes for longer videos. Progress updates automatically — you will be redirected to results when finished.
              </p>
            </UserBanner>
          </div>
        )}

        {error ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <p className="text-red-300 font-medium">{error}</p>
            <Link to="/analyze">
              <button className="mt-6 btn-dark text-sm">Back to Analyzer</button>
            </Link>
          </div>
        ) : !displayJob ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading job…</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Header card ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`elite-card p-6 sm:p-8 transition-all duration-500 ${
                isRunning ? 'border-cyan-500/20'
                : isDone ? 'border-emerald-500/25'
                : isFailed ? 'border-red-500/25'
                : ''
              }`}
            >
              <p className="elite-label mb-3">Analysis in progress</p>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white truncate sm:text-2xl">{displayJob.video_name}</h1>
                  <p className="text-gray-500 text-xs mt-1 font-mono truncate">{displayJob.job_id}</p>
                </div>
                {currentStage && isRunning && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${currentStage.grad} bg-opacity-15 border border-white/10 flex-shrink-0`}>
                    <currentStage.Icon className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-xs font-medium">{currentStage.label}</span>
                  </div>
                )}
              </div>

              {/* Circular ring */}
              <ProgressRing progress={progress} status={status} currentStage={currentStage} />

              <div className="text-center mt-5 space-y-1">
                {isRunning ? (
                  <p className="text-white font-semibold">
                    {friendlyStage(displayJob.stage || 'initializing')}
                  </p>
                ) : isDone ? (
                  <p className="text-emerald-400 font-semibold text-lg">Analysis complete — opening results…</p>
                ) : isFailed ? (
                  <p className="text-red-400 font-semibold">Analysis failed</p>
                ) : null}
                {currentStage && isRunning && (
                  <p className="text-gray-500 text-sm">{currentStage.sub}</p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-6">
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
                <div className="mt-6 text-center">
                  <Link to={`/analyze/results/${jobId}`}>
                    <button type="button" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 underline-offset-2 hover:underline">
                      Results ready? Open results now
                    </button>
                  </Link>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="elite-card p-5 sm:p-6"
            >
              <motion.div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-cyan-400" />
                <h2 className="elite-label mb-0">Pipeline</h2>
              </motion.div>

              <div className="space-y-2">
                {STAGES.map((stage, idx) => {
                  const done = isDone || idx < currentStageIdx;
                  const active = isRunning && idx === currentStageIdx;
                  const pend = !done && !active;

                  return (
                    <motion.div
                      key={stage.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                        active ? 'bg-white/10 border border-white/20'
                        : done  ? 'bg-white/5 backdrop-blur-md'
                        : 'bg-white/5 backdrop-blur-md'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        done   ? 'bg-green-500/15'
                        : active ? `bg-gradient-to-br ${stage.grad} shadow-lg`
                        : 'bg-white/10'
                      }`}
                        style={active ? { boxShadow: `0 0 12px ${stage.glow}` } : {}}>
                        {done
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <stage.Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${
                            done ? 'text-green-400' : active ? 'text-white' : 'text-gray-600'
                          }`}>{stage.label}</span>
                          {done && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          {active && (
                            <span className="flex items-center gap-1 text-xs text-cyan-400 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              running
                            </span>
                          )}
                        </div>
                        {(active || done) && (
                          <p className={`text-xs mt-0.5 ${done ? 'text-gray-600' : 'text-gray-500'}`}>
                            {stage.sub}
                          </p>
                        )}
                      </div>

                      {/* Step number */}
                      {pend && (
                        <span className="text-gray-700 text-xs tabular-nums flex-shrink-0">{idx + 1}</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Error detail ── */}
            {isFailed && displayJob.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5"
              >
                <p className="text-red-300 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Error Details
                </p>
                <p className="text-red-400/70 text-sm font-mono break-all bg-black/30 rounded-xl p-3">
                  {displayJob.error}
                </p>
                <Link to="/analyze">
                  <button className="mt-4 btn-dark text-sm">Return to Analyzer</button>
                </Link>
              </motion.div>
            )}

            {/* ── Completed card ── */}
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

            {/* ── Activity log ── */}
            {log.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="elite-card p-4 sm:p-5"
              >
                <p className="elite-label mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden />
                  Activity log
                </p>
                <div className="space-y-1 max-h-36 analyzer-scroll overflow-y-auto pr-1">
                  {log.map((entry, i) => (
                    <p key={`${entry.time}-${entry.msg}-${i}`} className="text-gray-500 text-xs leading-relaxed">
                      <span className="text-gray-700">[{entry.time}]</span>{' '}
                      {entry.msg}
                    </p>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
