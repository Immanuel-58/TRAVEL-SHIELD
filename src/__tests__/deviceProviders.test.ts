import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BrowserCameraProvider } from '../services/device/CameraProvider';
import { BrowserVoiceProvider } from '../services/device/VoiceProvider';
import { BrowserLocationProvider } from '../services/device/LocationProvider';
import { OfflineIntentParser } from '../services/ai/OfflineIntentParser';

describe('Phase 13 — CameraProvider', () => {
  it('detects camera availability truthfully in node environment', async () => {
    const provider = new BrowserCameraProvider();
    const status = await provider.checkAvailability();
    assert.strictEqual(status.hasCamera, false);
    assert.strictEqual(status.canStream, false);
    assert.ok(status.disclaimer.includes('unavailable') || status.disclaimer.includes('No camera'));
  });

  it('safely handles stopViewfinder with null stream', () => {
    const provider = new BrowserCameraProvider();
    assert.doesNotThrow(() => provider.stopViewfinder(null));
  });
});

describe('Phase 13 — VoiceProvider', () => {
  it('detects voice availability truthfully in node environment', async () => {
    const provider = new BrowserVoiceProvider();
    const status = await provider.checkAvailability();
    assert.strictEqual(status.isAvailable, false);
    assert.ok(status.disclaimer.length > 0);
  });

  it('triggers error callback when speech recognition is unsupported', (t, done) => {
    const provider = new BrowserVoiceProvider();
    provider.startListening({
      onResult: () => {},
      onError: (err) => {
        assert.ok(err.includes('not supported'));
        done();
      },
      onEnd: () => {},
    });
  });
});

describe('Phase 13 — LocationProvider', () => {
  it('detects geolocation availability in node environment', async () => {
    const provider = new BrowserLocationProvider();
    const status = await provider.checkAvailability();
    assert.strictEqual(status.isAvailable, false);
  });

  it('calculates accurate Haversine distance between two coordinates', () => {
    const provider = new BrowserLocationProvider();
    // Paris Eiffel Tower (48.8584, 2.2945) to Louvre Museum (48.8606, 2.3376)
    const distanceKm = provider.calculateDistanceKm(48.8584, 2.2945, 48.8606, 2.3376);
    assert.ok(distanceKm > 3.0 && distanceKm < 3.5); // ~3.15 km
  });
});

describe('Phase 13 — OfflineIntentParser', () => {
  const mockTrip = {
    id: 'paris-2026',
    name: 'Paris Trip',
    destination: 'Paris',
    currency: 'EUR',
    budget: 3000,
  };

  it('parses expense speech intent into valid ADD_EXPENSE ActionProposal', () => {
    const result = OfflineIntentParser.parse('Spent 45 euros on dinner', mockTrip);
    assert.strictEqual(result.matched, true);
    assert.strictEqual(result.intentType, 'ADD_EXPENSE');
    assert.ok(result.proposal);
    assert.strictEqual(result.proposal.actionType, 'ADD_EXPENSE');
    assert.strictEqual(result.proposal.payload.amount, 45);
    assert.strictEqual(result.proposal.payload.currency, 'EUR');
    assert.strictEqual(result.proposal.payload.category, 'food');
  });

  it('parses flight delay speech into valid CREATE_DISRUPTION ActionProposal', () => {
    const result = OfflineIntentParser.parse('My flight is delayed by 3 hours', mockTrip);
    assert.strictEqual(result.matched, true);
    assert.strictEqual(result.intentType, 'CREATE_DISRUPTION');
    assert.ok(result.proposal);
    assert.strictEqual(result.proposal.actionType, 'CREATE_DISRUPTION');
    assert.strictEqual(result.proposal.payload.type, 'FLIGHT_DELAY');
    assert.strictEqual(result.proposal.payload.severity, 'high');
  });

  it('parses itinerary addition speech into valid ADD_TO_ITINERARY ActionProposal', () => {
    const result = OfflineIntentParser.parse('Add Louvre tomorrow at 3pm', mockTrip);
    assert.strictEqual(result.matched, true);
    assert.strictEqual(result.intentType, 'ADD_TO_ITINERARY');
    assert.ok(result.proposal);
    assert.strictEqual(result.proposal.actionType, 'ADD_TO_ITINERARY');
    assert.strictEqual(result.proposal.payload.dayNumber, 2); // tomorrow = day 2
    assert.strictEqual(result.proposal.payload.startTime, '15:00');
  });

  it('returns matched=false for generic queries', () => {
    const result = OfflineIntentParser.parse('Hello how is the weather?', mockTrip);
    assert.strictEqual(result.matched, false);
    assert.strictEqual(result.intentType, 'QUERY_ANSWER');
  });
});
