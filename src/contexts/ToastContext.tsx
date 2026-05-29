/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;  // ms, 0 = sticky
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, message?: string) => string;
  error:   (title: string, message?: string) => string;
  info:    (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Individual Toast card ─────────────────────────────────────────────────────

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'border-emerald-500/40', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  error:   { border: 'border-red-500/40',     icon: 'text-red-400',     bg: 'bg-red-500/10' },
  info:    { border: 'border-cyan-500/40',    icon: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  warning: { border: 'border-amber-500/40',   icon: 'text-amber-400',   bg: 'bg-amber-500/10' },
};

function ToastCard({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon   = ICONS[t.type];
  const colors = COLORS[t.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dur = t.duration ?? 4000;
    if (dur <= 0) return;
    timerRef.current = setTimeout(onDismiss, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [t.id, t.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="alert"
      aria-live="assertive"
      className={`relative flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-xl bg-zinc-950/90 p-4 shadow-2xl shadow-black/60`}
    >
      <span className={`mt-0.5 shrink-0 ${colors.icon}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{t.title}</p>
        {t.message && (
          <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{t.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-gray-500 hover:text-white transition-colors mt-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
    return id;
  }, []);

  const success = useCallback((title: string, message?: string) =>
    toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) =>
    toast({ type: 'error', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) =>
    toast({ type: 'info', title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) =>
    toast({ type: 'warning', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, dismiss, dismissAll }}>
      {children}
      {/* Toast container — bottom-right */}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
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
