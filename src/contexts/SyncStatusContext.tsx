/**
 * SyncStatusContext — exposes cloud sync state (idle, syncing, success, error).
 *
 * Used by SyncStatusIndicator and for "Last synced X ago" display.
 *
 * @module contexts/SyncStatusContext
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

import { loadLastSyncTime, saveLastSyncTime } from '../utils/localStorage';

// ─── Types ───────────────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncStatusContextValue {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  lastSyncTime: Date | null;
  setLastSyncTime: (date: Date | string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────

const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────

interface SyncStatusProviderProps {
  children: ReactNode;
}

export function SyncStatusProvider({ children }: SyncStatusProviderProps) {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncTimeState, setLastSyncTimeState] = useState<Date | null>(null);

  useEffect(() => {
    const saved = loadLastSyncTime();
    if (saved) setLastSyncTimeState(saved);

    const onSyncComplete = (e: CustomEvent) => {
      if (e.detail?.time) setLastSyncTimeState(e.detail.time);
    };

    window.addEventListener('nutrinote-sync-complete', onSyncComplete as EventListener);
    return () =>
      window.removeEventListener('nutrinote-sync-complete', onSyncComplete as EventListener);
  }, []);

  const setLastSyncTime = useCallback((date: Date | string) => {
    const ts = date instanceof Date ? date : new Date(date);
    setLastSyncTimeState(ts);
    saveLastSyncTime(ts);
  }, []);

  const value: SyncStatusContextValue = {
    status,
    setStatus,
    lastSyncTime: lastSyncTimeState,
    setLastSyncTime,
  };

  return <SyncStatusContext.Provider value={value}>{children}</SyncStatusContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────

const DEFAULT_SYNC_STATUS: SyncStatusContextValue = {
  status: 'idle',
  setStatus: () => {},
  lastSyncTime: null,
  setLastSyncTime: () => {},
};

export function useSyncStatus(): SyncStatusContextValue {
  const ctx = useContext(SyncStatusContext);
  return ctx || DEFAULT_SYNC_STATUS;
}
