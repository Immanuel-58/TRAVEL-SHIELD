/**
 * OfflineStorage
 * 
 * Local persistence layer abstraction for offline packs, cached trip data,
 * and pending synchronization queues.
 * 
 * Protects components from direct browser storage coupling and provides
 * safe error-handling for storage quotas and browser compatibility.
 */

import { OfflineTripPack, SyncQueueItem } from '@/types/offline';

const PACK_PREFIX = 'travelshield_offline_pack_';
const SYNC_QUEUE_KEY = 'travelshield_sync_queue_v1';
const SIMULATED_OFFLINE_KEY = 'travelshield_simulated_offline';

export class OfflineStorage {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  // -- Offline Packs ----------------------------------------------------------

  static saveOfflinePack(pack: OfflineTripPack): boolean {
    if (!this.isBrowser()) return false;
    try {
      const key = `${PACK_PREFIX}${pack.tripId}`;
      localStorage.setItem(key, JSON.stringify(pack));
      return true;
    } catch (err) {
      console.warn('OfflineStorage: Failed to save offline pack', err);
      return false;
    }
  }

  static getOfflinePack(tripId: string): OfflineTripPack | null {
    if (!this.isBrowser()) return null;
    try {
      const key = `${PACK_PREFIX}${tripId}`;
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as OfflineTripPack;
    } catch (err) {
      console.warn(`OfflineStorage: Failed to read pack for ${tripId}`, err);
      return null;
    }
  }

  static removeOfflinePack(tripId: string): boolean {
    if (!this.isBrowser()) return false;
    try {
      const key = `${PACK_PREFIX}${tripId}`;
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  // -- Sync Queue -------------------------------------------------------------

  static getSyncQueue(tripId?: string): SyncQueueItem[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY);
      if (!data) return [];
      const all: SyncQueueItem[] = JSON.parse(data);
      if (tripId) {
        return all.filter(item => item.tripId === tripId);
      }
      return all;
    } catch (err) {
      console.warn('OfflineStorage: Failed to load sync queue', err);
      return [];
    }
  }

  static addToSyncQueue(item: SyncQueueItem): boolean {
    if (!this.isBrowser()) return false;
    try {
      const queue = this.getSyncQueue();
      // Deduplicate if same ID exists
      const filtered = queue.filter(q => q.id !== item.id);
      filtered.push(item);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.warn('OfflineStorage: Failed to add item to sync queue', err);
      return false;
    }
  }

  static updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): boolean {
    if (!this.isBrowser()) return false;
    try {
      const queue = this.getSyncQueue();
      const updated = queue.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }

  static removeSyncQueueItem(id: string): boolean {
    if (!this.isBrowser()) return false;
    try {
      const queue = this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== id);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  static clearSyncedItems(tripId?: string): void {
    if (!this.isBrowser()) return;
    try {
      const queue = this.getSyncQueue();
      const remaining = queue.filter(item => {
        if (tripId && item.tripId !== tripId) return true;
        return item.status !== 'synced';
      });
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    } catch (err) {
      console.warn('OfflineStorage: Failed to clear synced items', err);
    }
  }

  // -- Network Simulation Mode ------------------------------------------------

  static isSimulatedOffline(): boolean {
    if (!this.isBrowser()) return false;
    return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
  }

  static setSimulatedOffline(value: boolean): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(SIMULATED_OFFLINE_KEY, value ? 'true' : 'false');
    } catch {}
  }
}
