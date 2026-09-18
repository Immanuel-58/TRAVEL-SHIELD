import { DataTrustLabel } from './trip';

export type DisruptionType =
  | 'FLIGHT_DELAY'
  | 'FLIGHT_CANCELLED'
  | 'TRAIN_DELAY'
  | 'TRANSPORT_DELAY'
  | 'WEATHER'
  | 'VENUE_CLOSED'
  | 'ACTIVITY_UNAVAILABLE'
  | 'MISSED_CONNECTION'
  | 'USER_CHANGE'
  | 'TIME_CONSTRAINT'
  | 'BUDGET_CHANGE'
  | 'OTHER';

export type DisruptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DisruptionSource = 'user_reported' | 'external_provider' | 'demo';

export type DisruptionStatus = 'active' | 'reviewing' | 'resolved' | 'dismissed';

export interface DisruptionMetadata {
  delayMinutes?: number;
  weatherCondition?: string;
  temperatureC?: number;
  precipitationPercent?: number;
  venueName?: string;
  flightNumber?: string;
  alternativeVenue?: string;
  extraCost?: number;
  refundEstimate?: number;
  refundTrust?: DataTrustLabel;
  [key: string]: any;
}

export type ReplanChangeType = 'move' | 'reschedule' | 'remove' | 'add' | 'swap';

export interface ReplanChange {
  type: ReplanChangeType;
  itemId?: string;
  activityName: string;
  dayNumber: number;
  newDayNumber?: number;
  oldTime?: string;
  newTime?: string;
  reason: string;
}

export interface ReplanCostImpact {
  amount: number;
  currency: string;
  type: 'additional' | 'savings' | 'neutral';
  trust: DataTrustLabel;
}

export interface ReplanOption {
  id: string;
  disruptionId: string;
  title: string;
  description: string;
  strategy: 'reschedule' | 'drop' | 'swap' | 'compress' | 'custom';
  changes: ReplanChange[];
  costImpact: ReplanCostImpact;
  timeImpactMinutes: number;
  feasibilityScore: number; // 0 - 100
  tradeoffs: string[];
}

export interface Disruption {
  id: string;
  tripId: string;
  type: DisruptionType;
  title: string;
  description: string;
  detectedAt: string;
  affectedDate?: string;
  affectedItineraryItemIds?: string[];
  severity: DisruptionSeverity;
  source: DisruptionSource;
  status: DisruptionStatus;
  metadata?: DisruptionMetadata;
  replanOptions?: ReplanOption[];
  selectedOptionId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplanHistoryEntry {
  id: string;
  tripId: string;
  disruptionId: string;
  disruptionTitle: string;
  selectedOptionId: string;
  optionTitle: string;
  approvedAt: string;
  appliedChangesCount: number;
  summary: string;
  costImpactSummary: string;
  changesSnapshot: ReplanChange[];
}

export interface DisruptionImpactResult {
  disruptionId: string;
  affectedDate?: string;
  affectedItemIds: string[];
  affectedItemsCount: number;
  summary: string;
  severity: DisruptionSeverity;
  cascadeRisks: string[];
}
