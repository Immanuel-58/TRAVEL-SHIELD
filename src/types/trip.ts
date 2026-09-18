import { StructuredBudget, ItineraryDay, Place, Stay, DestinationResearch, TripDocument, HotelGuardSession } from './travel';
import { OfflineTripPack } from './offline';
import { Expense } from './expense';
import { Disruption, ReplanHistoryEntry } from './disruption';

export type TripStatus = 'active' | 'upcoming' | 'completed' | 'draft';

export type DataTrustLabel = 'LIVE' | 'CACHED' | 'ESTIMATED' | 'USER_ENTERED' | 'OFFLINE' | 'UNKNOWN';

export interface TripFormData {
  name: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  travelStyle: string;
  interests: string[];
}

export interface FormErrors {
  name?: string;
  origin?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: string;
  budget?: string;
  currency?: string;
}

export interface Trip extends TripFormData {
  id: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;

  // Phase 4 Intelligence Engine State
  structuredBudget?: StructuredBudget;
  itineraryDays?: ItineraryDay[];

  // Phase 5 Explore & Travel Research Saved State
  savedPlaces?: Place[];
  savedStays?: Stay[];
  savedResearch?: DestinationResearch;

  // Phase 7 Document Vault
  documents?: TripDocument[];

  // Phase 8 HotelGuard
  hotelGuardSessions?: HotelGuardSession[];

  // Phase 9 Offline Intelligence
  offlinePack?: OfflineTripPack;

  // Phase 10 Expenses & Multi-Currency
  expenses?: Expense[];

  // Phase 11 Disruption Detection & Dynamic AI Replanning
  disruptions?: Disruption[];
  replanHistory?: ReplanHistoryEntry[];

  // Structural placeholders for future phases
  itinerarySummary?: {
    totalItems: number;
    daysCount: number;
  };
  expensesSummary?: {
    totalSpent: number;
    categoriesCount: number;
  };
  documentsSummary?: {
    totalDocs: number;
    shieldActive: boolean;
  };
  hotelGuardSummary?: {
    totalInspections: number;
    verifiedLogs: number;
  };
}

