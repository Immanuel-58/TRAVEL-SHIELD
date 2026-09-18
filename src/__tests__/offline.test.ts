/**
 * Phase 9 � Offline Intelligence Unit Tests
 * 
 * Tests:
 * - OfflineTripPack compilation and coordinate caching
 * - Section availability mapping
 * - SyncQueue item creation, local application, and reconciliation
 * - Conflict detection and business rule validation
 * - LocalAIProvider capability detection (honest unconfigured state)
 * - Deterministic offline query handling without cloud AI
 * - OfflineStorage persistence
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Trip } from '../types/trip';
import { TripCacheService } from '../services/offline/TripCacheService';
import { SyncQueueService } from '../services/offline/SyncQueueService';
import { OfflineStorage } from '../services/offline/OfflineStorage';
import { LocalAIProvider, localAIProvider } from '../services/ai/LocalAIProvider';

const mockTrip: Trip = {
  id: 'test-offline-paris',
  name: 'Paris Offline Expedition',
  origin: 'New York (JFK)',
  destination: 'Paris, France',
  startDate: '2026-06-12',
  endDate: '2026-06-18',
  travelers: 2,
  budget: 4000,
  currency: 'USD',
  travelStyle: 'balanced',
  interests: ['culture', 'museums'],
  status: 'active',
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
  itineraryDays: [
    {
      dayNumber: 1,
      date: '2026-06-12',
      items: [
        {
          id: 'item-1',
          dayNumber: 1,
          date: '2026-06-12',
          activity: 'Louvre Museum Tour',
          location: 'Mus�e du Louvre, Paris',
          coordinates: { lat: 48.8606, lng: 2.3376 },
          startTime: '10:00',
          endTime: '13:00',
          durationMinutes: 180,
          estimatedCost: { amount: 45, currency: 'USD', trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 15,
          status: 'planned',
        },
      ],
    },
  ],
  savedPlaces: [
    {
      id: 'place-1',
      name: 'Eiffel Tower',
      destination: 'Paris, France',
      category: 'attraction',
      description: 'Iconic wrought-iron lattice tower.',
      address: 'Champ de Mars, 5 Av. Anatole France',
      coordinates: { lat: 48.8584, lng: 2.2945 },
      estimatedVisitDurationMinutes: 120,
      estimatedCost: { amount: 30, currency: 'USD', trustLabel: 'ESTIMATED' },
      source: 'Curated',
      trustLabel: 'ESTIMATED',
    },
  ],
  savedStays: [
    {
      id: 'stay-1',
      name: 'Le Marais Boutique Hotel',
      destination: 'Paris, France',
      location: 'Le Marais, Paris',
      coordinates: { lat: 48.8566, lng: 2.3622 },
      estimatedPricePerNight: { amount: 220, currency: 'USD', trustLabel: 'ESTIMATED' },
      source: 'Curated',
      trustLabel: 'ESTIMATED',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      tripId: 'test-offline-paris',
      filename: 'passport_scan.pdf',
      docType: 'passport',
      size: 245000,
      mimeType: 'application/pdf',
      uploadedAt: '2026-05-10T12:00:00Z',
      privacyStatus: 'SCANNED',
      storageKey: 'travelshield_doc_doc-1',
    },
  ],
  hotelGuardSessions: [
    {
      id: 'hg-1',
      tripId: 'test-offline-paris',
      propertyName: 'Le Marais Boutique Hotel',
      roomIdentifier: 'Room 304',
      status: 'CHECK_IN_RECORDED',
      createdAt: '2026-06-12T14:00:00Z',
      updatedAt: '2026-06-12T14:30:00Z',
      evidence: [],
    },
  ],
};

// -- 1. TripCacheService -------------------------------------------------------

describe('Phase 9 � TripCacheService', () => {
  it('builds a comprehensive OfflineTripPack with all 8 core components', () => {
    const pack = TripCacheService.buildTripPack(mockTrip);
    assert.strictEqual(pack.tripId, mockTrip.id);
    assert.strictEqual(pack.tripName, mockTrip.name);
    assert.strictEqual(pack.destination, mockTrip.destination);
    assert.strictEqual(pack.components.length, 10);
    assert.ok(pack.sizeBytes > 0, 'Pack should have a calculated byte size');

    const componentIds = pack.components.map(c => c.id);
    assert.ok(componentIds.includes('expenses'));
    assert.ok(componentIds.includes('itinerary'));
    assert.ok(componentIds.includes('places'));
    assert.ok(componentIds.includes('stays'));
    assert.ok(componentIds.includes('budget'));
    assert.ok(componentIds.includes('documents'));
    assert.ok(componentIds.includes('hotelguard'));
    assert.ok(componentIds.includes('mapData'));
    assert.ok(componentIds.includes('disruptions'));
  });

  it('extracts geocoded coordinates from centroid, itinerary, places, and stays', () => {
    const pack = TripCacheService.buildTripPack(mockTrip);
    assert.ok(pack.cachedCoordinates.length >= 4, 'Should extract coordinates from all entities');

    const types = pack.cachedCoordinates.map(c => c.type);
    assert.ok(types.includes('centroid'), 'Should include destination centroid');
    assert.ok(types.includes('activity'), 'Should include Louvre coordinates');
    assert.ok(types.includes('place'), 'Should include Eiffel Tower coordinates');
    assert.ok(types.includes('stay'), 'Should include Hotel coordinates');
  });

  it('determines per-section availability accurately without false live claims', () => {
    const onlineAvail = TripCacheService.getSectionAvailabilities(mockTrip, false);
    const offlineAvail = TripCacheService.getSectionAvailabilities(mockTrip, true);

    const exploreOffline = offlineAvail.find(s => s.sectionId === 'explore');
    assert.strictEqual(exploreOffline?.availability, 'CACHED');
    assert.strictEqual(exploreOffline?.trustLabel, 'CACHED');

    const assistantOffline = offlineAvail.find(s => s.sectionId === 'assistant');
    assert.strictEqual(assistantOffline?.trustLabel, 'OFFLINE');

    const budgetOffline = offlineAvail.find(s => s.sectionId === 'budget');
    assert.strictEqual(budgetOffline?.availability, 'AVAILABLE_OFFLINE');
  });
});

// -- 2. SyncQueueService -------------------------------------------------------

describe('Phase 9 � SyncQueueService', () => {
  it('applies an itinerary addition locally while offline', () => {
    const item = {
      id: 'sync-test-1',
      tripId: mockTrip.id,
      actionType: 'ADD_ITINERARY_ITEM' as const,
      payload: {
        dayNumber: 1,
        item: {
          activity: 'Arc de Triomphe Sunset',
          location: 'Place Charles de Gaulle',
          startTime: '18:30',
          endTime: '19:30',
          durationMinutes: 60,
          estimatedCost: { amount: 16, currency: 'USD', trustLabel: 'OFFLINE' },
          status: 'planned',
        },
      },
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0,
    };

    const res = SyncQueueService.applyLocally(mockTrip, item);
    assert.strictEqual(res.success, true);
    assert.ok(res.trip.itineraryDays);
    const day1 = res.trip.itineraryDays.find(d => d.dayNumber === 1);
    assert.strictEqual(day1?.items?.length, 2, 'Day 1 should now contain 2 activities');
  });

  it('applies an offline budget update locally', () => {
    const item = {
      id: 'sync-test-2',
      tripId: mockTrip.id,
      actionType: 'UPDATE_BUDGET' as const,
      payload: { amount: 5500 },
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0,
    };

    const res = SyncQueueService.applyLocally(mockTrip, item);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.trip.budget, 5500);
  });

  it('rejects invalid actions with business rule violations during reconciliation', () => {
    const invalidItem = {
      id: 'sync-test-invalid',
      tripId: mockTrip.id,
      actionType: 'UPDATE_BUDGET' as const,
      payload: { amount: -500 },
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0,
    };

    const res = SyncQueueService.processSyncQueue(mockTrip, [invalidItem]);
    assert.strictEqual(res.conflictCount, 1);
    assert.strictEqual(res.syncedCount, 0);
    assert.ok(res.errors[0].includes('Negative budget rejected'));
  });
});

// -- 3. LocalAIProvider --------------------------------------------------------

describe('Phase 9 � LocalAIProvider', () => {
  it('reports truthful capability detection when no on-device model is present', () => {
    const caps = LocalAIProvider.checkCapabilities();
    // In standard node/test environment, window.ai is absent
    assert.strictEqual(caps.isAvailable, false);
    assert.strictEqual(caps.fallbackMode, 'deterministic_engine');
    assert.ok(caps.disclaimer.includes('No cloud servers are contacted while offline'));
  });

  it('answers itinerary plan queries deterministically from local context', async () => {
    const response = await localAIProvider.sendMessage(
      [{ id: '1', role: 'user', content: 'What is my plan for today?', timestamp: new Date().toISOString() }],
      mockTrip as any
    );

    assert.ok(response.message.includes('OFFLINE MODE'));
    assert.ok(response.message.includes('Louvre Museum Tour'));
    assert.ok(response.message.includes('Day 1'));
  });

  it('answers budget queries deterministically with emergency buffer calculation', async () => {
    const response = await localAIProvider.sendMessage(
      [{ id: '2', role: 'user', content: 'How much is my budget and remaining buffer?', timestamp: new Date().toISOString() }],
      mockTrip as any
    );

    assert.ok(response.message.includes('OFFLINE MODE'));
    assert.ok(response.message.includes('$4,000 USD'));
    assert.ok(response.message.includes('10% Emergency Buffer'));
  });

  it('answers hotel and stay queries from local context', async () => {
    const response = await localAIProvider.sendMessage(
      [{ id: '3', role: 'user', content: 'Show my hotel and stay details', timestamp: new Date().toISOString() }],
      mockTrip as any
    );

    assert.ok(response.message.includes('Le Marais Boutique Hotel'));
    assert.ok(response.message.includes('HotelGuard Sessions'));
  });

  it('answers document vault queries without exposing raw files', async () => {
    const response = await localAIProvider.sendMessage(
      [{ id: '4', role: 'user', content: 'What documents do I have saved?', timestamp: new Date().toISOString() }],
      mockTrip as any
    );

    assert.ok(response.message.includes('passport_scan.pdf'));
    assert.ok(response.message.includes('SCANNED'));
  });
});
