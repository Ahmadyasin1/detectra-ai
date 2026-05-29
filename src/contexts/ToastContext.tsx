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
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;    // ms — 0 = sticky
  progress?: number;    // 0–100 for progress bar overlay
  actionLabel?: string;
  actionHref?: string;
  persist?: boolean;    // save to NotificationStore history
  jobId?: string;
  category?: NotifCategory;
}

type ShortOpts = Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>;

interface ToastContextValue {
  toasts: Toast[];
  toast:    (opts: Omit<Toast, 'id'>) => string;
  success:  (title: string, message?: string, opts?: ShortOpts) => string;
  error:    (title: string, message?: string, opts?: ShortOpts) => string;
  info:     (title: string, message?: string, opts?: ShortOpts) => string;
  warning:  (title: string, message?: string, opts?: ShortOpts) => string;
  critical: (title: string, message?: string, opts?: ShortOpts) => string;
  loading:  (title: string, message?: string) => string;
  update:   (id: string, opts: Partial<Omit<Toast, 'id'>>) => void;
  dismiss:  (id: string) => void;
  dismissAll: () => void;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success:  CheckCircle2,
  error:    XCircle,
  info:     Info,
  warning:  AlertTriangle,
  critical: Zap,
  loading:  Loader2,
};

interface ColorConfig {
  border: string;
  icon: string;
  bg: string;
  glow: string;
  bar: string;
  title: string;
  pulse?: true;
}

const COLORS: Record<ToastType, ColorConfig> = {
  success:  { border: 'border-emerald-500/40', icon: 'text-emerald-400', bg: 'bg-emerald-500/[0.07]', glow: 'shadow-emerald-500/10', bar: 'bg-emerald-500', title: 'text-white' },
  error:    { border: 'border-red-500/40',     icon: 'text-red-400',     bg: 'bg-red-500/[0.07]',     glow: 'shadow-red-500/10',     bar: 'bg-red-500',     title: 'text-white' },
  info:     { border: 'border-cyan-500/40',    icon: 'text-cyan-400',    bg: 'bg-cyan-500/[0.07]',    glow: 'shadow-cyan-500/10',    bar: 'bg-cyan-500',    title: 'text-white' },
  warning:  { border: 'border-amber-500/40',   icon: 'text-amber-400',   bg: 'bg-amber-500/[0.07]',   glow: 'shadow-amber-500/10',   bar: 'bg-amber-400',   title: 'text-white' },
  critical: { border: 'border-red-400/60',     icon: 'text-red-300',     bg: 'bg-red-500/[0.11]',     glow: 'shadow-red-500/25',     bar: 'bg-red-400',     title: 'text-red-100', pulse: true },
  loading:  { border: 'border-blue-500/40',    icon: 'text-blue-400',    bg: 'bg-blue-500/[0.07]',    glow: 'shadow-blue-500/10',    bar: 'bg-blue-500',    title: 'text-white' },
};

// ── Progress sweep bar (auto-dismiss countdown) ───────────────────────────────

function SweepBar({ duration, color }: { duration: number; color: string }) {
  return (
    <motion.div
      className={`absolute bottom-0 left-0 h-[2px] rounded-full ${color} opacity-55`}
      initial={{ width: '100%' }}
      animate={{ width: '0%' }}
      transition={{ duration: duration / 1000, ease: 'linear' }}
    />
  );
}

// ── Individual toast card ─────────────────────────────────────────────────────

function ToastCard({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon   = ICONS[t.type];
  const colors = COLORS[t.type];
  const dur    = t.duration ?? (t.type === 'loading' ? 0 : 4800);

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!dur) return;
    const timer = setTimeout(() => onDismissRef.current(), dur);
    return () => clearTimeout(timer);
  }, [t.id, dur]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 96, scale: 0.87, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0,  scale: 1,    filter: 'blur(0px)' }}
      exit={{   opacity: 0, x: 80,  scale: 0.9,  filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      role="alert"
      aria-live="assertive"
      className={`
        relative flex items-start gap-3.5 w-[21rem] max-w-[calc(100vw-2rem)] overflow-hidden
        rounded-2xl border ${colors.border} ${colors.bg}
        backdrop-blur-2xl bg-zinc-950/90 p-4
        shadow-2xl ${colors.glow} shadow-lg
      `}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${colors.bar} opacity-70`} />

      {/* Critical ping ring */}
      {colors.pulse && (
        <span className="absolute top-[14px] left-[14px] pointer-events-none">
          <span className={`absolute -inset-1 rounded-full ${colors.icon} opacity-20 animate-ping`} />
        </span>
      )}

      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${colors.icon} relative z-10`}>
        <Icon className={`h-[18px] w-[18px] ${t.type === 'loading' ? 'animate-spin' : ''}`} aria-hidden />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0 relative z-10">
        <p className={`text-[13px] font-semibold leading-snug ${colors.title}`}>{t.title}</p>

        {t.message && (
          <p className="mt-0.5 text-[11.5px] text-gray-400 leading-relaxed">{t.message}</p>
        )}

        {/* Manual progress bar (e.g. analysis %) */}
        {typeof t.progress === 'number' && (
          <div className="mt-2 h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${colors.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${t.progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.35 }}
            />
          </div>
        )}

        {/* Action link */}
        {t.actionLabel && t.actionHref && (
          <a
            href={t.actionHref}
            className={`inline-flex items-center mt-2 text-[11px] font-semibold ${colors.icon} hover:opacity-75 transition-opacity underline underline-offset-2`}
          >
            {t.actionLabel} →
          </a>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-gray-600 hover:text-gray-300 transition-colors mt-0.5 relative z-10"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Auto-dismiss sweep bar */}
      {dur > 0 && <SweepBar duration={dur} color={colors.bar} />}
    </motion.div>
  );
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { addNotification } = useNotificationStore();

  const dismiss    = useCallback((id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const update = useCallback((id: string, opts: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, ...opts } : t));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => {
      const next = [...prev, { ...opts, id }];
      return next.length > 8 ? next.slice(-8) : next;
    });

    // Persist critical / errors automatically; others only if flagged
    if (opts.persist || opts.type === 'critical' || opts.type === 'error') {
      addNotification({
        severity: (opts.type === 'critical' ? 'critical'
          : opts.type === 'loading' ? 'info'
          : opts.type) as NotifSeverity,
        category:  opts.category ?? (opts.type === 'critical' || opts.type === 'error' ? 'alert' : 'info'),
        title:     opts.title,
        message:   opts.message,
        jobId:     opts.jobId,
        actionLabel: opts.actionLabel,
        actionHref:  opts.actionHref,
      });
    }

    return id;
  }, [addNotification]);

  const success  = useCallback((t: string, m?: string, o?: ShortOpts) =>
    toast({ type: 'success',  title: t, message: m, ...o }), [toast]);
  const error    = useCallback((t: string, m?: string, o?: ShortOpts) =>
    toast({ type: 'error',    title: t, message: m, ...o }), [toast]);
  const info     = useCallback((t: string, m?: string, o?: ShortOpts) =>
    toast({ type: 'info',     title: t, message: m, ...o }), [toast]);
  const warning  = useCallback((t: string, m?: string, o?: ShortOpts) =>
    toast({ type: 'warning',  title: t, message: m, ...o }), [toast]);
  const critical = useCallback((t: string, m?: string, o?: ShortOpts) =>
    toast({ type: 'critical', title: t, message: m, persist: true, ...o }), [toast]);
  const loading  = useCallback((t: string, m?: string) =>
    toast({ type: 'loading',  title: t, message: m, duration: 0 }), [toast]);

  const MAX_VISIBLE = 5;
  const overflow    = toasts.length - MAX_VISIBLE;
  const visible     = toasts.slice(-MAX_VISIBLE);

  return (
    <ToastContext.Provider value={{
      toasts, toast, success, error, info, warning, critical, loading,
      update, dismiss, dismissAll,
    }}>
      {children}

      {/* Toast container — bottom-right */}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        <AnimatePresence>
          {overflow > 0 && (
            <motion.button
              type="button"
              key="overflow-badge"
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
              <ToastCard toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
