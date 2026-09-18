import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RouteService } from '../services/map/RouteService';
import { mapProvider } from '../services/map/MapProvider';
import { validateAIAction, processAIResponse } from '../services/ai/pipeline';
import { Trip } from '../types/trip';
import { ItineraryItem, Stay } from '../types/travel';

const mockTrip: Trip = {
  id: 'trip-map-test',
  name: 'Paris Map Test Trip',
  origin: 'New York, USA',
  destination: 'Paris, France',
  startDate: '2026-06-12',
  endDate: '2026-06-18',
  travelers: 2,
  budget: 5000,
  currency: 'USD',
  travelStyle: 'balanced',
  interests: ['culture'],
  status: 'active',
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
  itineraryDays: [
    {
      dayNumber: 1,
      date: '2026-06-12',
      items: [
        {
          id: 'item-eiffel',
          dayNumber: 1,
          date: '2026-06-12',
          activity: 'Eiffel Tower Tour',
          location: 'Champ de Mars, Paris',
          coordinates: { lat: 48.8584, lng: 2.2945 },
          locationTrustLabel: 'ESTIMATED',
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 120,
          estimatedCost: { amount: 30, currency: 'EUR', trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 15,
          status: 'planned',
        },
        {
          id: 'item-louvre',
          dayNumber: 1,
          date: '2026-06-12',
          activity: 'Louvre Museum Visit',
          location: 'Rue de Rivoli, Paris',
          coordinates: { lat: 48.8606, lng: 2.3376 },
          locationTrustLabel: 'ESTIMATED',
          startTime: '11:05', // Only 5 minute buffer, but ~3.16 km distance! Should trigger tightness warning
          endTime: '14:00',
          durationMinutes: 175,
          estimatedCost: { amount: 22, currency: 'EUR', trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 20,
          status: 'planned',
        },
        {
          id: 'item-unknown-coords',
          dayNumber: 1,
          date: '2026-06-12',
          activity: 'Secret Local Bakery',
          location: 'Hidden Alley, Paris',
          // coordinates missing!
          locationTrustLabel: 'UNKNOWN',
          startTime: '14:30',
          endTime: '15:30',
          durationMinutes: 60,
          estimatedCost: { amount: 10, currency: 'EUR', trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 10,
          status: 'planned',
        }
      ]
    }
  ]
};

describe('Phase 6 Route Intelligence & Spatial Map Engine', () => {
  it('should calculate deterministic Haversine distance between known coordinates', () => {
    const eiffel = { lat: 48.8584, lng: 2.2945 };
    const louvre = { lat: 48.8606, lng: 2.3376 };

    const distance = RouteService.calculateDistanceKm(eiffel, louvre);
    assert.strictEqual(typeof distance, 'number');
    // Distance between Eiffel Tower and Louvre is ~3.16 km
    assert.ok(distance >= 3.0 && distance <= 3.3, `Expected ~3.16km, got ${distance}`);

    // Same location returns 0
    assert.strictEqual(RouteService.calculateDistanceKm(eiffel, eiffel), 0);

    // Missing coordinates returns 0
    assert.strictEqual(RouteService.calculateDistanceKm(undefined, louvre), 0);
  });

  it('should estimate deterministic transit and walking travel times based on distance', () => {
    // Short distance (< 1.2 km) -> walking
    const shortWalkTime = RouteService.estimateTravelTimeMinutes(0.8, 'walking');
    assert.ok(shortWalkTime >= 5 && shortWalkTime <= 15, `Expected 5-15 min walk, got ${shortWalkTime}`);

    // Longer distance (3.2 km) -> transit
    const transitTime = RouteService.estimateTravelTimeMinutes(3.2, 'transit');
    assert.ok(transitTime >= 10 && transitTime <= 30, `Expected 10-30 min transit, got ${transitTime}`);

    // Zero distance returns 0
    assert.strictEqual(RouteService.estimateTravelTimeMinutes(0), 0);
  });

  it('should resolve destination centroids and bounds via MapProvider abstraction', () => {
    const centroid = mapProvider.getDestinationCentroid('Paris, France');
    assert.ok(centroid !== undefined);
    assert.strictEqual(centroid.lat, 48.8566);
    assert.strictEqual(centroid.lng, 2.3522);

    const bounds = mapProvider.getDestinationBounds('Paris, France', [
      { lat: 48.8584, lng: 2.2945 },
      { lat: 48.8606, lng: 2.3376 },
    ]);
    assert.ok(bounds.minLat < bounds.maxLat);
    assert.ok(bounds.minLng < bounds.maxLng);

    const providerStatus = mapProvider.getProviderStatus();
    assert.strictEqual(providerStatus.status, 'fallback');
    assert.strictEqual(providerStatus.trustLabel, 'ESTIMATED');
  });

  it('should compile a day route and detect schedule tightness and unmapped coordinates', () => {
    const day = mockTrip.itineraryDays![0];
    const summary = RouteService.compileDayRoute(day.items, day.dayNumber, day.date);

    assert.strictEqual(summary.dayNumber, 1);
    assert.strictEqual(summary.points.length, 3);
    // Leg between Eiffel and Louvre exists
    assert.strictEqual(summary.legs.length, 1);
    assert.ok(summary.totalDistanceKm > 3.0);
    assert.ok(summary.totalTravelTimeMinutes > 0);

    // Should detect schedule tightness between Eiffel (ends 11:00) and Louvre (starts 11:05)
    const tightnessWarning = summary.warnings.find(w => w.includes('Schedule Tight') || w.includes('exceeds'));
    assert.ok(tightnessWarning !== undefined, 'Expected schedule tightness warning');

    // Should detect unmapped coordinates for the bakery
    const unmappedWarning = summary.warnings.find(w => w.includes('UNKNOWN') || w.includes('verified coordinates'));
    assert.ok(unmappedWarning !== undefined, 'Expected unmapped coordinates warning');
  });

  it('should optimize day itinerary item sequence to minimize travel distance', () => {
    const items: ItineraryItem[] = [
      {
        id: 'stop-1',
        dayNumber: 1,
        date: '2026-06-12',
        activity: 'Stop 1 (West)',
        location: 'West Paris',
        coordinates: { lat: 48.8584, lng: 2.2945 }, // West
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 120,
        estimatedCost: { amount: 0, currency: 'EUR', trustLabel: 'ESTIMATED' },
        travelTimeMinutes: 10,
        status: 'planned',
      },
      {
        id: 'stop-2',
        dayNumber: 1,
        date: '2026-06-12',
        activity: 'Stop 2 (East)',
        location: 'East Paris',
        coordinates: { lat: 48.8530, lng: 2.3700 }, // Far East
        startTime: '11:30',
        endTime: '13:00',
        durationMinutes: 90,
        estimatedCost: { amount: 0, currency: 'EUR', trustLabel: 'ESTIMATED' },
        travelTimeMinutes: 10,
        status: 'planned',
      },
      {
        id: 'stop-3',
        dayNumber: 1,
        date: '2026-06-12',
        activity: 'Stop 3 (Center West)',
        location: 'Center West Paris',
        coordinates: { lat: 48.8600, lng: 2.3000 }, // Right next to Stop 1
        startTime: '14:00',
        endTime: '16:00',
        durationMinutes: 120,
        estimatedCost: { amount: 0, currency: 'EUR', trustLabel: 'ESTIMATED' },
        travelTimeMinutes: 10,
        status: 'planned',
      },
    ];

    const optimization = RouteService.optimizeDayItemSequence(items);
    assert.strictEqual(optimization.optimizedItems.length, 3);
    assert.ok(optimization.originalDistanceKm > 0);
    assert.ok(optimization.optimizedDistanceKm > 0);
    // Nearest neighbor from Stop 1 should pick Stop 3 first instead of jumping to far east Stop 2
    assert.strictEqual(optimization.optimizedItems[1].id, 'stop-3');
    assert.ok(optimization.savingsKm > 0, `Expected savings > 0, got ${optimization.savingsKm}`);
  });

  it('should validate OPTIMIZE_ROUTE and REORDER_ITINERARY_DAY AI action payloads', () => {
    // Valid OPTIMIZE_ROUTE
    const validOpt = validateAIAction({
      type: 'OPTIMIZE_ROUTE',
      payload: { dayNumber: 1 }
    });
    assert.strictEqual(validOpt.isValid, true);

    // Invalid OPTIMIZE_ROUTE (missing dayNumber)
    const invalidOpt = validateAIAction({
      type: 'OPTIMIZE_ROUTE',
      payload: {}
    });
    assert.strictEqual(invalidOpt.isValid, false);

    // Valid REORDER_ITINERARY_DAY
    const validReorder = validateAIAction({
      type: 'REORDER_ITINERARY_DAY',
      payload: { dayNumber: 1, orderedItemIds: ['item-louvre', 'item-eiffel'] }
    });
    assert.strictEqual(validReorder.isValid, true);

    // Invalid REORDER_ITINERARY_DAY (missing orderedItemIds)
    const invalidReorder = validateAIAction({
      type: 'REORDER_ITINERARY_DAY',
      payload: { dayNumber: 1 }
    });
    assert.strictEqual(invalidReorder.isValid, false);
  });

  it('should generate an ActionProposal card for OPTIMIZE_ROUTE action', () => {
    const result = processAIResponse({
      message: 'I have analyzed your Day 1 route and found geographic optimizations.',
      action: {
        type: 'OPTIMIZE_ROUTE',
        payload: { dayNumber: 1 }
      }
    }, mockTrip);

    assert.ok(result.proposal !== undefined);
    assert.strictEqual(result.proposal.actionType, 'OPTIMIZE_ROUTE');
    assert.ok(result.proposal.title.includes('Day 1'));
    assert.strictEqual(result.proposal.status, 'pending');
  });
});
