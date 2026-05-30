/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifSeverity = 'success' | 'error' | 'info' | 'warning' | 'critical';
export type NotifCategory  = 'analysis' | 'alert' | 'system' | 'info';

export interface StoredNotification {
  id:           string;
  severity:     NotifSeverity;
  category:     NotifCategory;
  title:        string;
  message?:     string;
  timestamp:    number;
  read:         boolean;
  jobId?:       string;
  actionLabel?: string;
  actionHref?:  string;
}

interface StoreValue {
  notifications:      StoredNotification[];
  unreadCount:        number;
  hasAnyCritical:     boolean;
  addNotification:    (opts: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => string;
  markRead:           (id: string) => void;
  markAllRead:        () => void;
  removeNotification: (id: string) => void;
  clearAll:           () => void;
}

// ── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'detectra_notifications_v2';
const MAX_STORED  = 100;

function load(): StoredNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredNotification[]) : [];
  } catch { return []; }
}

function persist(list: StoredNotification[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED))); }
  catch { /* storage quota */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<StoreValue | null>(null);

export function NotificationStoreProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>(load);

  useEffect(() => { persist(notifications); }, [notifications]);

  const addNotification = useCallback(
    (opts: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => {
      const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setNotifications((p) =>
        [{ ...opts, id, timestamp: Date.now(), read: false }, ...p].slice(0, MAX_STORED),
      );
      return id;
    }, [],
  );

  const markRead           = useCallback((id: string) =>
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead        = useCallback(() =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true }))), []);
  const removeNotification = useCallback((id: string) =>
    setNotifications((p) => p.filter((n) => n.id !== id)), []);
  const clearAll           = useCallback(() => setNotifications([]), []);

  const unreadCount    = notifications.filter((n) => !n.read).length;
  const hasAnyCritical = notifications.some((n) => !n.read && n.severity === 'critical');

  return (
    <Ctx.Provider value={{
      notifications, unreadCount, hasAnyCritical,
      addNotification, markRead, markAllRead, removeNotification, clearAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotificationStore(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotificationStore must be inside <NotificationStoreProvider>');
  return ctx;
}
