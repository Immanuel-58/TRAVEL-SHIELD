import { DataTrustLabel } from './trip';

export type OfflinePackStatus = 'NOT_DOWNLOADED' | 'DOWNLOADING' | 'READY' | 'STALE' | 'ERROR';

export interface OfflineComponentItem {
  id: 'overview' | 'itinerary' | 'places' | 'stays' | 'budget' | 'expenses' | 'documents' | 'hotelguard' | 'disruptions' | 'mapData';
  name: string;
  status: 'ready' | 'pending' | 'unavailable';
  itemCount: number;
  detail?: string;
}

export interface OfflineTripPack {
  tripId: string;
  tripName: string;
  destination: string;
  downloadedAt: string;
  version: number;
  sizeBytes: number;
  components: OfflineComponentItem[];
  cachedCoordinates: Array<{
    name: string;
    lat: number;
    lng: number;
    type: 'place' | 'stay' | 'activity' | 'centroid';
  }>;
  offlineNotes?: string;
}

export type SyncActionType =
  | 'ADD_ITINERARY_ITEM'
  | 'REMOVE_ITINERARY_ITEM'
  | 'UPDATE_BUDGET'
  | 'ADD_EXPENSE'
  | 'UPDATE_EXPENSE'
  | 'DELETE_EXPENSE'
  | 'SAVE_PLACE'
  | 'REMOVE_PLACE'
  | 'SAVE_STAY'
  | 'REMOVE_STAY'
  | 'ADD_HOTEL_EVIDENCE'
  | 'UPDATE_NOTES'
  | 'REPORT_DISRUPTION'
  | 'RESOLVE_DISRUPTION'
  | 'APPLY_REPLAN';

export type SyncItemStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';

export interface SyncQueueItem {
  id: string;
  tripId: string;
  actionType: SyncActionType;
  payload: Record<string, any>;
  createdAt: string;
  status: SyncItemStatus;
  retryCount: number;
  error?: string;
  conflictDetails?: string;
}

export type SectionAvailabilityType = 'AVAILABLE_OFFLINE' | 'CACHED' | 'ONLINE_ONLY';

export interface SectionAvailability {
  sectionId: string;
  title: string;
  availability: SectionAvailabilityType;
  details: string;
  trustLabel: DataTrustLabel;
}

export interface LocalAICapabilities {
  isAvailable: boolean;
  runtimeName: string;
  modelLoaded: boolean;
  fallbackMode: 'deterministic_engine';
  disclaimer: string;
}
