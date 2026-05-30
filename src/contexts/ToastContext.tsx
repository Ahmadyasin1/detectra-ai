/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Info, AlertTriangle, X, Zap, Loader2,
} from 'lucide-react';
import { useNotificationStore } from './NotificationStore';
import type { NotifCategory, NotifSeverity } from './NotificationStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'critical' | 'loading';

export interface Toast {
  id:           string;
  type:         ToastType;
  title:        string;
  message?:     string;
  duration?:    number;     // ms — 0 = sticky
  progress?:    number;     // 0-100 manual progress bar
  actionLabel?: string;
  actionHref?:  string;
  persist?:     boolean;    // also persist to notification history
  jobId?:       string;
  category?:    NotifCategory;
}

type ExtraOpts = Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>;

interface ToastCtxValue {
  toasts:     Toast[];
  toast:      (opts: Omit<Toast, 'id'>) => string;
  success:    (title: string, message?: string, opts?: ExtraOpts) => string;
  error:      (title: string, message?: string, opts?: ExtraOpts) => string;
  info:       (title: string, message?: string, opts?: ExtraOpts) => string;
  warning:    (title: string, message?: string, opts?: ExtraOpts) => string;
  critical:   (title: string, message?: string, opts?: ExtraOpts) => string;
  loading:    (title: string, message?: string) => string;
  update:     (id: string, patch: Partial<Omit<Toast, 'id'>>) => void;
  dismiss:    (id: string) => void;
  dismissAll: () => void;
}

// ── Icon + colour maps ────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ElementType> = {
  success:  CheckCircle2,
  error:    XCircle,
  info:     Info,
  warning:  AlertTriangle,
  critical: Zap,
  loading:  Loader2,
};

interface Colors { border: string; icon: string; bg: string; glow: string; bar: string; title: string; pulse?: true }
const COLORS: Record<ToastType, Colors> = {
  success:  { border: 'border-emerald-500/40', icon: 'text-emerald-400', bg: 'bg-emerald-500/[0.06]', glow: 'shadow-emerald-500/10', bar: 'bg-emerald-500', title: 'text-white' },
  error:    { border: 'border-red-500/40',     icon: 'text-red-400',     bg: 'bg-red-500/[0.06]',     glow: 'shadow-red-500/10',     bar: 'bg-red-500',     title: 'text-white' },
  info:     { border: 'border-cyan-500/40',    icon: 'text-cyan-400',    bg: 'bg-cyan-500/[0.06]',    glow: 'shadow-cyan-500/10',    bar: 'bg-cyan-500',    title: 'text-white' },
  warning:  { border: 'border-amber-500/40',   icon: 'text-amber-400',   bg: 'bg-amber-500/[0.06]',   glow: 'shadow-amber-500/10',   bar: 'bg-amber-400',   title: 'text-white' },
  critical: { border: 'border-red-400/60',     icon: 'text-red-300',     bg: 'bg-red-500/[0.10]',     glow: 'shadow-red-500/25',     bar: 'bg-red-400',     title: 'text-red-100', pulse: true },
  loading:  { border: 'border-blue-500/40',    icon: 'text-blue-400',    bg: 'bg-blue-500/[0.06]',    glow: 'shadow-blue-500/10',    bar: 'bg-blue-500',    title: 'text-white' },
};

// ── Auto-dismiss sweep bar ────────────────────────────────────────────────────

function SweepBar({ duration, barClass }: { duration: number; barClass: string }) {
  return (
    <motion.div
      className={`absolute bottom-0 left-0 h-[2px] rounded-full ${barClass} opacity-50`}
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: duration / 1000, ease: 'linear' }}
    />
  );
}

// ── Single toast card ─────────────────────────────────────────────────────────

function ToastCard({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const c   = COLORS[t.type];
  const dur = t.duration ?? (t.type === 'loading' ? 0 : 4800);

  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (!dur) return;
    const id = setTimeout(() => dismissRef.current(), dur);
    return () => clearTimeout(id);
  }, [t.id, dur]);

  const Icon = ICONS[t.type] as React.FC<{ className?: string; 'aria-hidden'?: boolean }>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 96, scale: 0.86, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0,  scale: 1,    filter: 'blur(0px)' }}
      exit={{   opacity: 0, x: 80,  scale: 0.9,  filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 350, damping: 26 }}
      role="alert"
      aria-live="assertive"
      className={`
        relative flex items-start gap-3.5 w-[21rem] max-w-[calc(100vw-2rem)]
        overflow-hidden rounded-2xl
        border ${c.border} ${c.bg}
        backdrop-blur-2xl bg-zinc-950/92
        p-4 shadow-2xl ${c.glow} shadow-lg
      `}
    >
      {/* Left accent */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${c.bar} opacity-75`} />

      {/* Critical ping */}
      {c.pulse && (
        <span className="absolute top-[14px] left-[13px] pointer-events-none">
          <span className={`absolute -inset-1 rounded-full ${c.icon} opacity-20 animate-ping`} />
        </span>
      )}

      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${c.icon} relative z-10`}>
        <Icon
          className={`h-[18px] w-[18px] ${t.type === 'loading' ? 'animate-spin' : ''}`}
          aria-hidden
        />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0 relative z-10">
        <p className={`text-[13px] font-semibold leading-snug ${c.title}`}>{t.title}</p>
        {t.message && (
          <p className="mt-0.5 text-[11.5px] text-gray-400 leading-relaxed">{t.message}</p>
        )}
        {typeof t.progress === 'number' && (
          <div className="mt-2 h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${c.bar}`}
              animate={{ width: `${t.progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.35 }}
            />
          </div>
        )}
        {t.actionLabel && t.actionHref && (
          <a
            href={t.actionHref}
            className={`inline-flex items-center mt-2 text-[11px] font-semibold ${c.icon} hover:opacity-75 underline underline-offset-2 transition-opacity`}
          >
            {t.actionLabel} →
          </a>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-0.5 relative z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Sweep bar */}
      {dur > 0 && <SweepBar duration={dur} barClass={c.bar} />}
    </motion.div>
  );
}

// ── Context + Provider ────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastCtxValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { addNotification }  = useNotificationStore();

  const dismiss    = useCallback((id: string) =>
    setToasts((p) => p.filter((t) => t.id !== id)), []);
  const dismissAll = useCallback(() => setToasts([]), []);
  const update     = useCallback((id: string, patch: Partial<Omit<Toast, 'id'>>) =>
    setToasts((p) => p.map((t) => t.id === id ? { ...t, ...patch } : t)), []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((p) => {
      const next = [...p, { ...opts, id }];
      return next.length > 8 ? next.slice(-8) : next;
    });
    if (opts.persist || opts.type === 'critical' || opts.type === 'error') {
      addNotification({
        severity:    (opts.type === 'critical' ? 'critical' : opts.type === 'loading' ? 'info' : opts.type) as NotifSeverity,
        category:    opts.category ?? (opts.type === 'critical' || opts.type === 'error' ? 'alert' : 'info'),
        title:       opts.title,
        message:     opts.message,
        jobId:       opts.jobId,
        actionLabel: opts.actionLabel,
        actionHref:  opts.actionHref,
      });
    }
    return id;
  }, [addNotification]);

  const success  = useCallback((title: string, msg?: string, o?: ExtraOpts) => toast({ type: 'success',  title, message: msg, ...o }), [toast]);
  const error    = useCallback((title: string, msg?: string, o?: ExtraOpts) => toast({ type: 'error',    title, message: msg, ...o }), [toast]);
  const info     = useCallback((title: string, msg?: string, o?: ExtraOpts) => toast({ type: 'info',     title, message: msg, ...o }), [toast]);
  const warning  = useCallback((title: string, msg?: string, o?: ExtraOpts) => toast({ type: 'warning',  title, message: msg, ...o }), [toast]);
  const critical = useCallback((title: string, msg?: string, o?: ExtraOpts) => toast({ type: 'critical', title, message: msg, persist: true, ...o }), [toast]);
  const loading  = useCallback((title: string, msg?: string) => toast({ type: 'loading', title, message: msg, duration: 0 }), [toast]);

  const MAX_VIS  = 5;
  const overflow = toasts.length - MAX_VIS;
  const visible  = toasts.slice(-MAX_VIS);

  return (
    <ToastCtx.Provider value={{ toasts, toast, success, error, info, warning, critical, loading, update, dismiss, dismissAll }}>
      {children}

      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        <AnimatePresence>
          {overflow > 0 && (
            <motion.button
              key="overflow"
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={dismissAll}
              className="pointer-events-auto text-[11px] text-gray-400 bg-white/[0.06] border border-white/10 rounded-full px-3 py-1 hover:bg-white/10 transition-colors"
            >
              +{overflow} more · dismiss all
            </motion.button>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          {visible.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard t={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastCtxValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}
