import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  HonestTelemetryDisruptionProvider, 
  DISRUPTION_PROVIDER_DISCLAIMER 
} from '@/services/disruption/DisruptionProvider';
import { ReplanEngine } from '@/services/disruption/ReplanEngine';
import { Disruption, ReplanOption } from '@/types/disruption';
import { Trip } from '@/types/trip';
import { validateAIAction, validateBusinessRules, processAIResponse } from '@/services/ai/pipeline';
import { SyncQueueService } from '@/services/offline/SyncQueueService';
import { LocalAIProvider } from '@/services/ai/LocalAIProvider';

const mockTripForDisruption: Trip = {
  id: 'trip-disrupt-test',
  name: 'Tokyo Spring Adventure',
  origin: 'San Francisco, USA (SFO)',
  destination: 'Tokyo, Japan',
  startDate: '2026-04-10',
  endDate: '2026-04-16',
  travelers: 2,
  budget: 5000,
  currency: 'USD',
  travelStyle: 'cultural',
  interests: ['culture', 'food', 'gardens'],
  status: 'active',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  itinerarySummary: { totalItems: 4, daysCount: 7 },
  expensesSummary: { totalSpent: 0, categoriesCount: 0 },
  documentsSummary: { totalDocs: 1, shieldActive: true },
  hotelGuardSummary: { totalInspections: 0, verifiedLogs: 0 },
  itineraryDays: [
    {
      dayNumber: 1,
      date: '2026-04-10',
      items: [
        {
          id: 'item-tokyo-1',
          dayNumber: 1,
          date: '2026-04-10',
          activity: 'Arrive at Narita Airport (NRT)',
          location: 'Narita Airport Terminal 1',
          startTime: '14:00',
          endTime: '15:30',
          durationMinutes: 90,
          travelTimeMinutes: 0,
          estimatedCost: { amount: 30, currency: 'USD', trustLabel: 'ESTIMATED' },
          status: 'planned',
          notes: 'Flight JL001 arriving at 14:00',
        },
        {
          id: 'item-tokyo-2',
          dayNumber: 1,
          date: '2026-04-10',
          activity: 'Check in at Shibuya Hotel',
          location: 'Shibuya Stream Excel Hotel',
          startTime: '16:30',
          endTime: '17:30',
          durationMinutes: 60,
          travelTimeMinutes: 60,
          estimatedCost: { amount: 0, currency: 'USD', trustLabel: 'ESTIMATED' },
          status: 'planned',
        },
        {
          id: 'item-tokyo-3',
          dayNumber: 1,
          date: '2026-04-10',
          activity: 'Outdoor Walking Tour of Shibuya Crossing & Hachiko',
          location: 'Shibuya Crossing',
          startTime: '18:00',
          endTime: '19:30',
          durationMinutes: 90,
          travelTimeMinutes: 15,
          estimatedCost: { amount: 0, currency: 'USD', trustLabel: 'ESTIMATED' },
          status: 'planned',
          notes: 'Open air walking tour',
        },
        {
          id: 'item-tokyo-4',
          dayNumber: 1,
          date: '2026-04-10',
          activity: 'Dinner at Shibuya Sky Dining',
          location: 'Shibuya Sky',
          startTime: '20:00',
          endTime: '22:00',
          durationMinutes: 120,
          travelTimeMinutes: 10,
          estimatedCost: { amount: 80, currency: 'USD', trustLabel: 'ESTIMATED' },
          status: 'planned',
        },
      ],
    },
    {
      dayNumber: 2,
      date: '2026-04-11',
      items: [
        {
          id: 'item-tokyo-5',
          dayNumber: 2,
          date: '2026-04-11',
          activity: 'Asakusa Sensoji Temple Visit',
          location: 'Asakusa, Tokyo',
          startTime: '09:30',
          endTime: '12:00',
          durationMinutes: 150,
          travelTimeMinutes: 30,
          estimatedCost: { amount: 0, currency: 'USD', trustLabel: 'ESTIMATED' },
          status: 'planned',
        },
      ],
    },
  ],
  disruptions: [],
  replanHistory: [],
};

describe('Phase 11 — Honest Telemetry & Disruption Provider', () => {
  const provider = new HonestTelemetryDisruptionProvider();

  it('provides a truthful disclaimer highlighting lack of live ACARS or radar telemetry without credentials', () => {
    assert.ok(DISRUPTION_PROVIDER_DISCLAIMER.length > 50);
    assert.ok(DISRUPTION_PROVIDER_DISCLAIMER.includes('Live telemetry claims are refused'));
    assert.ok(DISRUPTION_PROVIDER_DISCLAIMER.includes('transparent trust labeling'));
  });

  it('generates demo scenarios with honest ESTIMATED trust labels and demo source', () => {
    const flightDelay = provider.createDemoDisruption('flight_delay_3h', mockTripForDisruption);
    assert.strictEqual(flightDelay.type, 'FLIGHT_DELAY');
    assert.strictEqual(flightDelay.severity, 'high');
    assert.strictEqual(flightDelay.source, 'demo');
    assert.strictEqual(flightDelay.status, 'active');
    assert.strictEqual(flightDelay.metadata?.delayMinutes, 180);
    assert.ok(flightDelay.metadata?.flightNumber);
  });

  it('parses natural language user reports accurately into typed disruptions', () => {
    const parsedFlight = provider.parseUserDisruptionReport('My flight is delayed by 3 hours due to air traffic', mockTripForDisruption);
    assert.strictEqual(parsedFlight.type, 'FLIGHT_DELAY');
    assert.strictEqual(parsedFlight.severity, 'high');
    assert.strictEqual(parsedFlight.source, 'user_reported');
    assert.strictEqual(parsedFlight.metadata?.delayMinutes, 180);

    const parsedRain = provider.parseUserDisruptionReport('Heavy torrential rain and thunderstorm all afternoon', mockTripForDisruption);
    assert.strictEqual(parsedRain.type, 'WEATHER');
    assert.strictEqual(parsedRain.severity, 'medium');

    const parsedClosure = provider.parseUserDisruptionReport('The museum is closed for unexpected renovations', mockTripForDisruption);
    assert.strictEqual(parsedClosure.type, 'VENUE_CLOSED');
  });
});

describe('Phase 11 — Deterministic ReplanEngine (Impact Assessment)', () => {
  it('analyzes impact of a 3-hour flight delay on day 1 schedule', () => {
    const disruption: Disruption = {
      id: 'disrupt-flight-1',
      tripId: mockTripForDisruption.id,
      type: 'FLIGHT_DELAY',
      title: 'Flight Delayed 3 Hours',
      description: 'JL001 delayed by 180 minutes',
      severity: 'high',
      source: 'user_reported',
      status: 'active',
      detectedAt: new Date().toISOString(),
      metadata: { delayMinutes: 180 },
      affectedDate: '2026-04-10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const impact = ReplanEngine.analyzeImpact(mockTripForDisruption, disruption);
    assert.strictEqual(impact.severity, 'high');
    assert.ok(impact.affectedItemIds.length >= 1, 'Should identify affected items');
    assert.ok(impact.cascadeRisks.length > 0);
    assert.ok(impact.summary.length > 0);
  });

  it('analyzes impact of adverse weather on outdoor activities', () => {
    const rainDisruption: Disruption = {
      id: 'disrupt-rain-1',
      tripId: mockTripForDisruption.id,
      type: 'WEATHER',
      title: 'Heavy Rain Forecast',
      description: 'Torrential downpour expected',
      severity: 'medium',
      source: 'demo',
      status: 'active',
      detectedAt: new Date().toISOString(),
      affectedDate: '2026-04-10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const impact = ReplanEngine.analyzeImpact(mockTripForDisruption, rainDisruption);
    assert.strictEqual(impact.severity, 'medium');
    assert.ok(impact.affectedItemIds.length >= 1);
    assert.ok(impact.summary.toLowerCase().includes('rain') || impact.summary.toLowerCase().includes('weather'));
    assert.ok(impact.cascadeRisks.some(r => r.includes('outdoor')));
  });
});

describe('Phase 11 — 3-Tier Replan Option Generation & Validation', () => {
  const flightDisruption: Disruption = {
    id: 'disrupt-test-gen',
    tripId: mockTripForDisruption.id,
    type: 'FLIGHT_DELAY',
    title: 'Flight Delayed 180 min',
    description: 'Inbound flight delayed',
    severity: 'high',
    source: 'demo',
    status: 'active',
    detectedAt: new Date().toISOString(),
    metadata: { delayMinutes: 180 },
    affectedDate: '2026-04-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('generates 3 structured replan alternatives (Option A, Option B, Option C)', () => {
    const options = ReplanEngine.generateReplanOptions(mockTripForDisruption, flightDisruption);
    assert.strictEqual(options.length, 3);

    const [optA, optB, optC] = options;
    assert.strictEqual(optA.strategy, 'reschedule');
    assert.strictEqual(optB.strategy, 'drop');
    assert.strictEqual(optC.strategy, 'swap');

    // Feasibility and tradeoff checks
    assert.ok(optA.feasibilityScore >= 60 && optA.feasibilityScore <= 100);
    assert.ok(optB.feasibilityScore >= 60 && optB.feasibilityScore <= 100);
    assert.ok(optC.feasibilityScore >= 60 && optC.feasibilityScore <= 100);

    assert.ok(optA.tradeoffs.length > 0);
    assert.ok(optB.tradeoffs.length > 0);
    assert.ok(optC.tradeoffs.length > 0);
    assert.ok(optA.changes.length > 0);
  });

  it('validates options deterministically rejecting invalid schedules or times', () => {
    const validOption: ReplanOption = {
      id: 'opt-valid',
      disruptionId: flightDisruption.id,
      title: 'Shift schedule back',
      description: 'Push activities',
      strategy: 'reschedule',
      tradeoffs: ['Later dinner'],
      feasibilityScore: 85,
      costImpact: { amount: 0, currency: 'USD', type: 'neutral', trust: 'ESTIMATED' },
      timeImpactMinutes: 60,
      changes: [
        {
          type: 'reschedule',
          dayNumber: 1,
          itemId: 'item-tokyo-2',
          activityName: 'Check in at Shibuya Hotel',
          oldTime: '16:30',
          newTime: '19:30',
          reason: 'Flight delayed 3h',
        },
      ],
    };

    const validResult = ReplanEngine.validateReplan(mockTripForDisruption, validOption);
    assert.strictEqual(validResult.isValid, true);
    assert.strictEqual(validResult.errors.length, 0);

    // Invalid option: invalid day and invalid time format
    const invalidOption: ReplanOption = {
      ...validOption,
      changes: [
        {
          type: 'reschedule',
          dayNumber: 99, // non-existent day
          itemId: 'item-unknown',
          activityName: 'Unknown Item',
          oldTime: '16:30',
          newTime: '25:99', // invalid 24h format
          reason: 'test error',
        },
      ],
    };

    const invalidResult = ReplanEngine.validateReplan(mockTripForDisruption, invalidOption);
    assert.strictEqual(invalidResult.isValid, false);
    assert.ok(invalidResult.errors.length >= 2);
  });

  it('applies a replan option deterministically, resolving disruption and logging history', () => {
    const optionToApply: ReplanOption = {
      id: 'opt-apply-test',
      disruptionId: flightDisruption.id,
      title: 'Shift afternoon schedule',
      description: 'Push times safely',
      strategy: 'reschedule',
      tradeoffs: ['Pushes check-in to 19:30'],
      feasibilityScore: 90,
      costImpact: { amount: 0, currency: 'USD', type: 'neutral', trust: 'ESTIMATED' },
      timeImpactMinutes: 60,
      changes: [
        {
          type: 'reschedule',
          dayNumber: 1,
          itemId: 'item-tokyo-2',
          activityName: 'Check in at Shibuya Hotel',
          oldTime: '16:30',
          newTime: '19:30',
          reason: 'Flight delay adjustment',
        },
      ],
    };

    const tripWithDisruption: Trip = {
      ...mockTripForDisruption,
      disruptions: [flightDisruption],
      replanHistory: [],
    };

    const { updatedTrip, historyEntry } = ReplanEngine.applyReplan(tripWithDisruption, optionToApply);

    // Day 1 item-tokyo-2 should now have startTime 19:30
    const day1 = updatedTrip.itineraryDays?.[0];
    const modifiedItem = day1?.items.find(i => i.id === 'item-tokyo-2');
    assert.strictEqual(modifiedItem?.startTime, '19:30');

    // Disruption status should be resolved
    const resolvedDisrupt = updatedTrip.disruptions?.find(d => d.id === flightDisruption.id);
    assert.strictEqual(resolvedDisrupt?.status, 'resolved');

    // Replan history should record entry
    assert.strictEqual(updatedTrip.replanHistory?.length, 1);
    assert.strictEqual(historyEntry.selectedOptionId, 'opt-apply-test');
    assert.strictEqual(historyEntry.disruptionId, flightDisruption.id);
  });
});

describe('Phase 11 — AI Pipeline Orchestration (CREATE_DISRUPTION & APPLY_REPLAN)', () => {
  it('validates and generates proposal for CREATE_DISRUPTION action', () => {
    const action = {
      type: 'CREATE_DISRUPTION' as const,
      payload: {
        tripId: mockTripForDisruption.id,
        type: 'FLIGHT_DELAY',
        title: 'Flight Delayed 2h',
        description: 'Weather ground stop at departure airport',
        severity: 'high',
        metadata: { delayMinutes: 120 },
      },
    };

    const schemaResult = validateAIAction(action);
    assert.strictEqual(schemaResult.isValid, true);

    const businessResult = validateBusinessRules(action, mockTripForDisruption);
    assert.strictEqual(businessResult.isValid, true);

    const response = processAIResponse(
      {
        message: 'I have detected a flight delay and logged it for replanning.',
        action,
      },
      mockTripForDisruption
    );
    assert.strictEqual(response.proposal?.actionType, 'CREATE_DISRUPTION');
    assert.strictEqual(response.proposal?.status, 'pending');
    assert.ok(response.proposal?.title.includes('Flight Delayed 2h'));
  });

  it('validates and generates proposal for APPLY_REPLAN action', () => {
    const testOption: ReplanOption = {
      id: 'opt-pipeline-test',
      disruptionId: 'disrupt-123',
      title: 'Drop low-priority activity',
      description: 'Remove walking tour to preserve dinner',
      strategy: 'drop',
      tradeoffs: ['Miss walking tour'],
      feasibilityScore: 92,
      costImpact: { amount: 0, currency: 'USD', type: 'neutral', trust: 'ESTIMATED' },
      timeImpactMinutes: 60,
      changes: [
        {
          type: 'remove',
          dayNumber: 1,
          itemId: 'item-tokyo-3',
          activityName: 'Outdoor Walking Tour of Shibuya Crossing & Hachiko',
          reason: 'Not enough daylight remaining',
        },
      ],
    };

    const action = {
      type: 'APPLY_REPLAN' as const,
      payload: {
        tripId: mockTripForDisruption.id,
        option: testOption,
      },
    };

    const schemaResult = validateAIAction(action);
    assert.strictEqual(schemaResult.isValid, true);

    const businessResult = validateBusinessRules(action, mockTripForDisruption);
    assert.strictEqual(businessResult.isValid, true);

    const response = processAIResponse(
      {
        message: 'Applying Option B to protect your evening schedule.',
        action,
      },
      mockTripForDisruption
    );
    assert.strictEqual(response.proposal?.actionType, 'APPLY_REPLAN');
    assert.strictEqual(response.proposal?.status, 'pending');
    assert.ok(response.proposal?.title.includes('Drop low-priority activity'));
  });

  it('rejects invalid action payload with structured validation error', () => {
    const invalidAction = {
      type: 'CREATE_DISRUPTION',
      payload: { tripId: 'trip-disrupt-test' }, // missing type & title
    };

    const schemaResult = validateAIAction(invalidAction);
    assert.strictEqual(schemaResult.isValid, false);
    assert.ok(schemaResult.error?.includes('title'));
  });
});

describe('Phase 11 — Offline Sync Queue & Local AI Disruption Handling', () => {
  it('applies REPORT_DISRUPTION locally while offline', () => {
    const disruption: Disruption = {
      id: 'disrupt-offline-1',
      tripId: mockTripForDisruption.id,
      type: 'TRANSPORT_DELAY',
      title: 'Subway Line Suspended',
      description: 'Signal malfunction on Yamanote Line',
      severity: 'medium',
      source: 'user_reported',
      status: 'active',
      detectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const syncAction = {
      id: 'sync-rep-1',
      tripId: mockTripForDisruption.id,
      actionType: 'REPORT_DISRUPTION' as const,
      payload: disruption,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0,
    };

    const res = SyncQueueService.applyLocally(mockTripForDisruption, syncAction);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.trip.disruptions?.length, 1);
    assert.strictEqual(res.trip.disruptions?.[0].id, 'disrupt-offline-1');
  });

  it('applies APPLY_REPLAN locally while offline and shifts schedule', () => {
    const tripWithDisrupt: Trip = {
      ...mockTripForDisruption,
      disruptions: [
        {
          id: 'disrupt-offline-target',
          tripId: mockTripForDisruption.id,
          type: 'FLIGHT_DELAY',
          title: 'Flight Delayed',
          description: 'Delayed 2h',
          severity: 'high',
          source: 'user_reported',
          status: 'active',
          detectedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      replanHistory: [],
    };

    const option: ReplanOption = {
      id: 'opt-offline-apply',
      disruptionId: 'disrupt-offline-target',
      title: 'Offline time shift',
      description: 'Shift check in time to 17:30',
      strategy: 'reschedule',
      tradeoffs: ['Slight shift'],
      feasibilityScore: 90,
      costImpact: { amount: 0, currency: 'USD', type: 'neutral', trust: 'ESTIMATED' },
      timeImpactMinutes: 60,
      changes: [
        {
          type: 'reschedule',
          dayNumber: 1,
          itemId: 'item-tokyo-2',
          activityName: 'Check in at Shibuya Hotel',
          oldTime: '16:30',
          newTime: '17:30',
          reason: 'Offline shift',
        },
      ],
    };

    const syncAction = {
      id: 'sync-opt-1',
      tripId: mockTripForDisruption.id,
      actionType: 'APPLY_REPLAN' as const,
      payload: { option },
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      retryCount: 0,
    };

    const res = SyncQueueService.applyLocally(tripWithDisrupt, syncAction);
    assert.strictEqual(res.success, true);
    const day1Item = res.trip.itineraryDays?.[0].items.find(i => i.id === 'item-tokyo-2');
    assert.strictEqual(day1Item?.startTime, '17:30');
    assert.strictEqual(res.trip.disruptions?.[0].status, 'resolved');
    assert.strictEqual(res.trip.replanHistory?.length, 1);
  });

  it('LocalAIProvider answers disruption and replan queries deterministically offline', async () => {
    const tripWithData: Trip = {
      ...mockTripForDisruption,
      disruptions: [
        {
          id: 'disrupt-offline-q',
          tripId: mockTripForDisruption.id,
          type: 'FLIGHT_DELAY',
          title: 'Flight JL001 delayed 3 hours',
          description: 'Inbound maintenance delay',
          severity: 'high',
          source: 'user_reported',
          status: 'active',
          detectedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const localAI = new LocalAIProvider();
    const response = await localAI.sendMessage(
      [{ id: 'disrupt-q-1', role: 'user', content: 'Show my active disruptions and replans', timestamp: new Date().toISOString() }],
      tripWithData
    );
    assert.ok(response.message.includes('OFFLINE MODE'));
    assert.ok(response.message.includes('Disruptions'));
    assert.ok(response.message.includes('Flight JL001 delayed 3 hours'));
  });
});
