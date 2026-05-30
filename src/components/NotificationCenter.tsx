import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, CheckCheck, Trash2,
  CheckCircle2, XCircle, Info, AlertTriangle, Zap,
  X, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useNotificationStore,
  type StoredNotification,
  type NotifCategory,
  type NotifSeverity,
} from '../contexts/NotificationStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000)      return 'just now';
  if (d < 3_600_000)   return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000)  return `${Math.floor(d / 3_600_000)}h ago`;
  if (d < 172_800_000) return 'yesterday';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function group(ns: StoredNotification[]) {
  const now = Date.now();
  const today: StoredNotification[] = [];
  const yesterday: StoredNotification[] = [];
  const earlier: StoredNotification[] = [];
  for (const n of ns) {
    const age = now - n.timestamp;
    if (age < 86_400_000)       today.push(n);
    else if (age < 172_800_000) yesterday.push(n);
    else                        earlier.push(n);
  }
  return { today, yesterday, earlier };
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SEV_ICONS: Record<NotifSeverity, React.ElementType> = {
  success:  CheckCircle2,
  error:    XCircle,
  info:     Info,
  warning:  AlertTriangle,
  critical: Zap,
};

const SEV_COLORS: Record<NotifSeverity, { icon: string; bg: string; ring: string }> = {
  success:  { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/25' },
  error:    { icon: 'text-red-400',     bg: 'bg-red-500/10',     ring: 'ring-red-500/25'     },
  info:     { icon: 'text-cyan-400',    bg: 'bg-cyan-500/10',    ring: 'ring-cyan-500/25'    },
  warning:  { icon: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'ring-amber-500/25'   },
  critical: { icon: 'text-red-300',     bg: 'bg-red-500/[0.13]', ring: 'ring-red-400/45'     },
};

const CAT_LABELS: Record<NotifCategory, string> = {
  analysis: 'Analysis',
  alert:    'Alert',
  system:   'System',
  info:     'Info',
};

type Tab = 'all' | NotifCategory;
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'alert',    label: 'Alerts'   },
  { id: 'analysis', label: 'Analysis' },
  { id: 'system',   label: 'System'   },
];

// ── Notification row ──────────────────────────────────────────────────────────

function NotifRow({
  n, onRead, onRemove,
}: { n: StoredNotification; onRead: () => void; onRemove: () => void }) {
  const s    = SEV_COLORS[n.severity];
  const Icon = SEV_ICONS[n.severity] as React.FC<{ className?: string; 'aria-hidden'?: boolean }>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
      onClick={onRead}
      className={`
        relative group flex items-start gap-3 px-4 py-3.5 cursor-pointer select-none transition-colors
        ${n.read ? 'opacity-50 hover:opacity-70' : 'hover:bg-white/[0.035]'}
      `}
    >
      {/* Unread dot */}
      {!n.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
      )}

      {/* Avatar */}
      <span className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ring-1 ${s.ring} ${s.bg}`}>
        <Icon className={`h-4 w-4 ${s.icon}`} aria-hidden />
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[12.5px] font-semibold leading-snug ${n.read ? 'text-gray-400' : n.severity === 'critical' ? 'text-red-200' : 'text-white'}`}>
            {n.title}
          </p>
          <span className="shrink-0 text-[10px] text-gray-600 mt-0.5 whitespace-nowrap">
            {relTime(n.timestamp)}
          </span>
        </div>
        {n.message && (
          <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${s.bg} ${s.icon}`}>
            {CAT_LABELS[n.category]}
          </span>
          {n.actionHref && n.actionLabel && (
            <Link
              to={n.actionHref}
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${s.icon} hover:opacity-80 underline underline-offset-2`}
            >
              {n.actionLabel}<ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 transition-all mt-0.5"
        aria-label="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-4">
        <Bell className="h-6 w-6 text-gray-600" />
      </span>
      <p className="text-sm font-semibold text-gray-400">All clear</p>
      <p className="mt-1 text-[11px] text-gray-600 leading-relaxed max-w-[190px]">
        Alerts, job completions, and system events appear here.
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState<Tab>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  const {
    notifications, unreadCount, hasAnyCritical,
    markRead, markAllRead, removeNotification, clearAll,
  } = useNotificationStore();

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (open && !panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    if (open) { document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }
  }, [open]);

  const filtered = tab === 'all' ? notifications : notifications.filter((n) => n.category === tab);
  const { today, yesterday, earlier } = group(filtered);
  const isEmpty = filtered.length === 0;

  const onRead   = useCallback((id: string) => markRead(id), [markRead]);
  const onRemove = useCallback((id: string) => removeNotification(id), [removeNotification]);

  return (
    <div className="relative" data-nav-notif>
      {/* Bell button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        className={`
          relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors
          ${open
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-white/10 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.07]'}
        `}
      >
        <motion.span
          key={unreadCount > 0 ? 'ring' : 'bell'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {unreadCount > 0
            ? <BellRing className="h-4 w-4" aria-hidden />
            : <Bell     className="h-4 w-4" aria-hidden />}
        </motion.span>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className={`
                absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                flex items-center justify-center rounded-full
                text-[9px] font-bold text-white
                ${hasAnyCritical ? 'bg-red-500' : 'bg-cyan-500'}
              `}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
              {hasAnyCritical && (
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -8,  scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`
              absolute right-0 top-full mt-2 z-50
              w-[23rem] max-w-[calc(100vw-1rem)]
              rounded-2xl border border-white/10
              bg-gradient-to-b from-zinc-900/96 to-zinc-950/96
              backdrop-blur-2xl shadow-2xl shadow-black/60
              overflow-hidden flex flex-col max-h-[80vh]
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-1.5 py-0.5">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    title="Mark all read"
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-lg px-2 py-1 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Read all
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    title="Clear all"
                    className="flex items-center text-[11px] text-gray-500 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/[0.07] border border-white/[0.07] rounded-lg px-2 py-1 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-white/[0.05] shrink-0">
              {TABS.map((t) => {
                const cnt = t.id === 'all'
                  ? notifications.filter((n) => !n.read).length
                  : notifications.filter((n) => n.category === t.id && !n.read).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`
                      flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors
                      ${tab === t.id
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}
                    `}
                  >
                    {t.label}
                    {cnt > 0 && (
                      <span className={`text-[9px] font-bold rounded-full px-1 ${tab === t.id ? 'bg-cyan-500/25 text-cyan-300' : 'bg-white/[0.08] text-gray-400'}`}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {isEmpty ? <EmptyState /> : (
                <AnimatePresence initial={false}>
                  {today.length > 0 && (
                    <motion.div key="today" layout>
                      <GroupLabel label="Today" />
                      {today.map((n) => (
                        <NotifRow key={n.id} n={n} onRead={() => onRead(n.id)} onRemove={() => onRemove(n.id)} />
                      ))}
                    </motion.div>
                  )}
                  {yesterday.length > 0 && (
                    <motion.div key="yesterday" layout>
                      <GroupLabel label="Yesterday" />
                      {yesterday.map((n) => (
                        <NotifRow key={n.id} n={n} onRead={() => onRead(n.id)} onRemove={() => onRemove(n.id)} />
                      ))}
                    </motion.div>
                  )}
                  {earlier.length > 0 && (
                    <motion.div key="earlier" layout>
                      <GroupLabel label="Earlier" />
                      {earlier.map((n) => (
                        <NotifRow key={n.id} n={n} onRead={() => onRead(n.id)} onRemove={() => onRemove(n.id)} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/[0.06] shrink-0 flex items-center justify-between">
                <span className="text-[10px] text-gray-600">
                  {notifications.length} total · {notifications.filter((n) => n.read).length} read
                </span>
                <span className="text-[10px] text-gray-700">Detectra AI</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
