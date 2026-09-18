'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Trip } from '@/types/trip';
import {
  OfflineTripPack,
  OfflinePackStatus,
  SyncQueueItem,
  SyncActionType,
  LocalAICapabilities,
} from '@/types/offline';
import { OfflineStorage } from '@/services/offline/OfflineStorage';
import { TripCacheService } from '@/services/offline/TripCacheService';
import { SyncQueueService } from '@/services/offline/SyncQueueService';
import { LocalAIProvider } from '@/services/ai/LocalAIProvider';
import { useTrip } from './TripContext';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  activePack: OfflineTripPack | null;
  packStatus: OfflinePackStatus;
  downloadProgress: { message: string; percent: number } | null;
  downloadTripPack: (trip: Trip) => Promise<boolean>;
  removeTripPack: (tripId: string) => void;
  syncQueue: SyncQueueItem[];
  pendingSyncCount: number;
  isSyncing: boolean;
  lastSyncResult: { syncedCount: number; conflictCount: number; errors: string[] } | null;
  triggerSync: (trip: Trip) => Promise<{ syncedCount: number; conflictCount: number; errors: string[] }>;
  queueOfflineAction: (tripId: string, actionType: SyncActionType, payload: Record<string, any>) => SyncQueueItem;
  capabilities: LocalAICapabilities;
  refreshState: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { activeTrip, updateTrip } = useTrip();

  const [rawIsOnline, setRawIsOnline] = useState<boolean>(true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [activePack, setActivePack] = useState<OfflineTripPack | null>(null);
  const [packStatus, setPackStatus] = useState<OfflinePackStatus>('NOT_DOWNLOADED');
  const [downloadProgress, setDownloadProgress] = useState<{ message: string; percent: number } | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ syncedCount: number; conflictCount: number; errors: string[] } | null>(null);
  const [capabilities, setCapabilities] = useState<LocalAICapabilities>({
    isAvailable: false,
    runtimeName: 'Checking...',
    modelLoaded: false,
    fallbackMode: 'deterministic_engine',
    disclaimer: '',
  });

  // Effective offline status: either real navigator offline or simulated
  const isOffline = !rawIsOnline || isSimulatedOffline;
  const isOnline = !isOffline;

  // Initialize network status & simulation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRawIsOnline(navigator.onLine);
      setIsSimulatedOffline(OfflineStorage.isSimulatedOffline());
      setCapabilities(LocalAIProvider.checkCapabilities());

      const handleOnline = () => {
        setRawIsOnline(true);
      };
      const handleOffline = () => {
        setRawIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Sync state whenever activeTrip changes
  const refreshState = useCallback(() => {
    if (activeTrip) {
      const pack = OfflineStorage.getOfflinePack(activeTrip.id);
      setActivePack(pack);
      setPackStatus(pack ? 'READY' : 'NOT_DOWNLOADED');
      setSyncQueue(OfflineStorage.getSyncQueue(activeTrip.id));
    } else {
      setActivePack(null);
      setPackStatus('NOT_DOWNLOADED');
      setSyncQueue(OfflineStorage.getSyncQueue());
    }
  }, [activeTrip]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const toggleSimulatedOffline = useCallback(() => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOffline(nextVal);
    OfflineStorage.setSimulatedOffline(nextVal);
  }, [isSimulatedOffline]);

  const downloadTripPack = useCallback(async (trip: Trip): Promise<boolean> => {
    try {
      setPackStatus('DOWNLOADING');
      const pack = await TripCacheService.simulatePackDownload(trip, (msg, pct) => {
        setDownloadProgress({ message: msg, percent: pct });
      });

      const success = OfflineStorage.saveOfflinePack(pack);
      if (success) {
        setActivePack(pack);
        setPackStatus('READY');
        setDownloadProgress(null);
        return true;
      } else {
        setPackStatus('ERROR');
        setDownloadProgress(null);
        return false;
      }
    } catch (err) {
      console.error('Failed to download offline pack:', err);
      setPackStatus('ERROR');
      setDownloadProgress(null);
      return false;
    }
  }, []);

  const removeTripPack = useCallback((tripId: string) => {
    OfflineStorage.removeOfflinePack(tripId);
    setActivePack(null);
    setPackStatus('NOT_DOWNLOADED');
  }, []);

  const triggerSync = useCallback(async (trip: Trip) => {
    setIsSyncing(true);
    try {
      // Allow realistic sync transition
      await new Promise(r => setTimeout(r, 600));

      const result = SyncQueueService.processSyncQueue(trip);

      // If changes were applied, update trip state
      if (result.syncedCount > 0) {
        updateTrip(trip.id, result.updatedTrip);
        // Also refresh cached offline pack
        const updatedPack = TripCacheService.buildTripPack(result.updatedTrip);
        OfflineStorage.saveOfflinePack(updatedPack);
        setActivePack(updatedPack);
      }

      setLastSyncResult({
        syncedCount: result.syncedCount,
        conflictCount: result.conflictCount,
        errors: result.errors,
      });
      setSyncQueue(OfflineStorage.getSyncQueue(trip.id));

      // Clean up successfully synced entries after a brief delay
      setTimeout(() => {
        OfflineStorage.clearSyncedItems(trip.id);
        setSyncQueue(OfflineStorage.getSyncQueue(trip.id));
      }, 3000);

      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [updateTrip]);

  // Automatic sync when connection returns
  useEffect(() => {
    if (isOnline && activeTrip) {
      const pending = SyncQueueService.getPendingCount(activeTrip.id);
      if (pending > 0 && !isSyncing) {
        triggerSync(activeTrip);
      }
    }
  }, [isOnline, activeTrip, isSyncing, triggerSync]);

  const queueOfflineAction = useCallback((
    tripId: string,
    actionType: SyncActionType,
    payload: Record<string, any>
  ): SyncQueueItem => {
    const item = SyncQueueService.enqueue(tripId, actionType, payload);
    setSyncQueue(OfflineStorage.getSyncQueue(tripId));

    // If activeTrip is currently loaded, apply locally immediately to memory
    if (activeTrip && activeTrip.id === tripId) {
      const applyResult = SyncQueueService.applyLocally(activeTrip, item);
      if (applyResult.success) {
        updateTrip(tripId, applyResult.trip);
      }
    }

    return item;
  }, [activeTrip, updateTrip]);

  const pendingSyncCount = syncQueue.filter(
    item => item.status === 'pending' || item.status === 'failed'
  ).length;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOffline,
        isSimulatedOffline,
        toggleSimulatedOffline,
        activePack,
        packStatus,
        downloadProgress,
        downloadTripPack,
        removeTripPack,
        syncQueue,
        pendingSyncCount,
        isSyncing,
        lastSyncResult,
        triggerSync,
        queueOfflineAction,
        capabilities,
        refreshState,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}