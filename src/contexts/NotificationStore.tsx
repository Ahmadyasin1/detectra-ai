/* eslint-disable react-refresh/only-export-components */
import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifSeverity = 'success' | 'error' | 'info' | 'warning' | 'critical';
export type NotifCategory = 'analysis' | 'alert' | 'system' | 'info';

export interface StoredNotification {
  id: string;
  severity: NotifSeverity;
  category: NotifCategory;
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  jobId?: string;
  actionLabel?: string;
  actionHref?: string;
}

interface NotificationStoreValue {
  notifications: StoredNotification[];
  unreadCount: number;
  hasAnyCritical: boolean;
  addNotification: (opts: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => string;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'detectra_notifications_v2';
const MAX_STORED = 100;

function loadFromStorage(): StoredNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredNotification[];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: StoredNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)));
  } catch { /* ignore quota */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationStoreCtx = createContext<NotificationStoreValue | null>(null);

export function NotificationStoreProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const addNotification = useCallback((opts: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const notif: StoredNotification = { ...opts, id, timestamp: Date.now(), read: false };
    setNotifications((prev) => [notif, ...prev].slice(0, MAX_STORED));
    return id;
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasAnyCritical = notifications.some((n) => !n.read && n.severity === 'critical');

  return (
    <NotificationStoreCtx.Provider value={{
      notifications, unreadCount, hasAnyCritical,
      addNotification, markRead, markAllRead, removeNotification, clearAll,
    }}>
      {children}
    </NotificationStoreCtx.Provider>
  );
}

export function useNotificationStore(): NotificationStoreValue {
  const ctx = useContext(NotificationStoreCtx);
  if (!ctx) throw new Error('useNotificationStore must be used inside <NotificationStoreProvider>');
  return ctx;
}
