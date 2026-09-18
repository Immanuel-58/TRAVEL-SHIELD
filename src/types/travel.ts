import { DataTrustLabel } from './trip';

export type BudgetCategory = 
  | 'flights'
  | 'accommodation'
  | 'food'
  | 'local_transport'
  | 'activities'
  | 'shopping'
  | 'insurance'
  | 'emergency'
  | 'miscellaneous';

export interface CategoryAllocation {
  category: BudgetCategory;
  name: string;
  allocatedAmount: number;
  estimatedCost: number;
  spentAmount: number;
  trustLabel: DataTrustLabel;
}

export interface StructuredBudget {
  totalBudget: number;
  estimatedTotal: number;
  actualSpent: number;
  remainingBudget: number;
  emergencyBuffer: number;
  currency: string;
  trustLabel: DataTrustLabel;
  categories: CategoryAllocation[];
}

export interface ItineraryItem {
  id: string;
  dayNumber: number;
  date: string;
  activity: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  locationTrustLabel?: DataTrustLabel;
  placeId?: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  durationMinutes: number;
  estimatedCost: {
    amount: number;
    currency: string;
    trustLabel: DataTrustLabel;
  };
  travelTimeMinutes: number;
  notes?: string;
  status: 'planned' | 'completed' | 'cancelled';
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  items: ItineraryItem[];
}

export interface ItineraryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PlanningProposalResult {
  tripSummary: string;
  budget: StructuredBudget;
  itineraryDays: ItineraryDay[];
  planningWarnings: string[];
  assumptions: string[];
}

// Phase 5 Explore & Travel Research Models
export type PlaceCategory = 
  | 'attraction'
  | 'viewpoint'
  | 'food'
  | 'activity'
  | 'neighborhood'
  | 'miscellaneous';

export interface Place {
  id: string;
  name: string;
  destination: string;
  category: PlaceCategory;
  description: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  estimatedVisitDurationMinutes: number;
  estimatedCost: {
    amount: number;
    currency: string;
    trustLabel: DataTrustLabel;
  };
  openingInfo?: string;
  source: string;
  trustLabel: DataTrustLabel;
  savedStatus?: boolean;
  notes?: string;
  imageUrl?: string;
}

export interface Stay {
  id: string;
  name: string;
  destination: string;
  location: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category?: 'hotel' | 'resort' | 'apartment' | 'hostel' | 'villa';
  estimatedPricePerNight: {
    amount: number;
    currency: string;
    trustLabel: DataTrustLabel;
  };
  totalEstimatedCost?: {
    amount: number;
    currency: string;
    trustLabel: DataTrustLabel;
  };
  rating?: number;
  amenities?: string[];
  source: string;
  trustLabel: DataTrustLabel;
  savedStatus?: boolean;
  notes?: string;
  imageUrl?: string;
}

export interface DestinationResearch {
  destination: string;
  bestAreasToStay: Array<{
    name: string;
    description: string;
    highlights: string[];
  }>;
  topPlaces: Place[];
  topStays: Stay[];
  generalNotes: string[];
  seasonConsiderations: string[];
}

// Phase 6 Route Intelligence & Location Models
export interface RoutePoint {
  id: string;
  name: string;
  type: 'itinerary' | 'place' | 'stay';
  coordinates?: {
    lat: number;
    lng: number;
  };
  dayNumber?: number;
  time?: string;
  address?: string;
  trustLabel: DataTrustLabel;
  notes?: string;
}

export interface RouteLeg {
  from: RoutePoint;
  to: RoutePoint;
  distanceKm: number;
  travelTimeMinutes: number;
  mode: 'transit' | 'walking' | 'driving';
  trustLabel: DataTrustLabel;
}

export interface DayRouteSummary {
  dayNumber: number;
  date?: string;
  points: RoutePoint[];
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalTravelTimeMinutes: number;
  warnings: string[];
  trustLabel: DataTrustLabel;
}

export interface MapProviderStatus {
  status: 'fallback' | 'connected' | 'simulated';
  hasOfflineSupport: boolean;
  disclaimer: string;
  trustLabel: DataTrustLabel;
}

// ─── Phase 7: Document Vault ────────────────────────────────────────────────

export type TripDocumentType =
  | 'passport'
  | 'visa'
  | 'flight'
  | 'hotel'
  | 'insurance'
  | 'identity'
  | 'other';

export type DocumentPrivacyStatus =
  | 'UNSCANNED'
  | 'SCANNED'
  | 'SENSITIVE_DATA_FOUND'
  | 'REDACTED'
  | 'PROTECTED_COPY'
  | 'USER_REVIEW_REQUIRED';

/** A single sensitive pattern match found during local scanning */
export interface SensitiveMatch {
  field: string;   // e.g. "Passport Number"
  pattern: string; // regex pattern name
  example: string; // redacted example, e.g. "A123****"
}

/** Metadata record for a trip document stored in the Document Vault */
export interface TripDocument {
  id: string;
  tripId: string;
  filename: string;
  docType: TripDocumentType;
  /** File size in bytes */
  size: number;
  mimeType: string;
  uploadedAt: string; // ISO 8601
  privacyStatus: DocumentPrivacyStatus;
  sensitiveMatches?: SensitiveMatch[];
  /** User-provided description / notes — also used as input for local scanning */
  notes?: string;
  /** localStorage key where base64 file data is stored (separate from trip metadata) */
  storageKey: string;
}

// ─── Phase 8: HotelGuard ─────────────────────────────────────────────────────

export type HotelGuardSessionStatus =
  | 'PENDING'
  | 'CHECK_IN_RECORDED'
  | 'CHECK_OUT_RECORDED'
  | 'COMPARISON_READY'
  | 'REVIEW_REQUIRED'
  | 'REPORT_READY';

export type HotelEvidenceType = 'CHECK_IN' | 'CHECK_OUT';

export interface HotelEvidence {
  id: string;
  sessionId: string;
  type: HotelEvidenceType;
  filename: string;
  capturedAt: string; // ISO 8601
  notes?: string;
  size: number;
  mimeType: string;
  /** localStorage key for base64 photo data */
  storageKey: string;
  /** Optional label for area photographed, e.g. "Bathroom", "TV", "Bed" */
  area?: string;
}

export interface HotelComparison {
  id: string;
  sessionId: string;
  createdAt: string;
  /** Number of check-in evidence items */
  checkInCount: number;
  /** Number of check-out evidence items */
  checkOutCount: number;
  /** User-written observations during review */
  userNotes: string;
  reviewedByUser: boolean;
  /** Simple metadata-based confidence label */
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Areas covered at check-in */
  checkInAreas: string[];
  /** Areas covered at check-out */
  checkOutAreas: string[];
  /** Areas in check-in not found in check-out */
  missingAreas: string[];
}

export interface HotelGuardSession {
  id: string;
  tripId: string;
  propertyName: string;
  roomIdentifier?: string;
  checkInAt?: string;   // ISO 8601 — when check-in evidence was first captured
  checkOutAt?: string;  // ISO 8601 — when check-out evidence was first captured
  status: HotelGuardSessionStatus;
  createdAt: string;
  updatedAt: string;
  evidence: HotelEvidence[];
  comparison?: HotelComparison;
}
