import { describe, it } from 'node:test';
import assert from 'node:assert';
import { placesProvider } from '../services/explore/PlacesProvider';
import { stayProvider } from '../services/explore/StayProvider';
import { destinationResearchProvider } from '../services/explore/DestinationResearchProvider';
import { validateAIAction, processAIResponse } from '../services/ai/pipeline';
import { Trip } from '../types/trip';
import { Place, Stay } from '../types/travel';

const mockTrip: Trip = {
  id: 'paris-expedition-2026',
  name: 'Paris Expedition 2026',
  origin: 'New York, USA',
  destination: 'Paris, France',
  startDate: '2026-06-12',
  endDate: '2026-06-18',
  travelers: 2,
  budget: 4500,
  currency: 'USD',
  travelStyle: 'balanced',
  interests: ['culture', 'food'],
  status: 'active',
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-01T10:00:00Z',
  savedPlaces: [],
  savedStays: [],
};

const samplePlace: Place = {
  id: 'place-test-1',
  name: 'Louvre Museum',
  destination: 'Paris, France',
  category: 'attraction',
  description: 'World-famous museum.',
  address: 'Rue de Rivoli, Paris',
  estimatedVisitDurationMinutes: 180,
  estimatedCost: { amount: 22, currency: 'EUR', trustLabel: 'ESTIMATED' },
  source: 'TravelShield Test Engine',
  trustLabel: 'ESTIMATED',
};

const sampleStay: Stay = {
  id: 'stay-test-1',
  name: 'Le Meurice',
  destination: 'Paris, France',
  location: '1st Arr., Paris',
  category: 'hotel',
  estimatedPricePerNight: { amount: 450, currency: 'EUR', trustLabel: 'ESTIMATED' },
  rating: 4.8,
  source: 'TravelShield Test Engine',
  trustLabel: 'ESTIMATED',
};

describe('Phase 5 Explore & Travel Research Layer', () => {
  it('should search places for known destination with explicit trust labels', async () => {
    const places = await placesProvider.searchPlaces('Paris, France');
    assert.strictEqual(places.length > 0, true);
    assert.strictEqual(places[0].trustLabel, 'ESTIMATED');
    assert.strictEqual(places[0].destination.includes('Paris'), true);
  });

  it('should generate realistic fallback research places for any arbitrary destination', async () => {
    const places = await placesProvider.searchPlaces('Reykjavik, Iceland');
    assert.strictEqual(places.length, 4);
    assert.strictEqual(places[0].destination, 'Reykjavik, Iceland');
    assert.strictEqual(places[0].trustLabel, 'ESTIMATED');
  });

  it('should search stays for known destination with estimated night rates', async () => {
    const stays = await stayProvider.searchStays('Paris, France');
    assert.strictEqual(stays.length > 0, true);
    assert.strictEqual(stays[0].trustLabel, 'ESTIMATED');
    assert.strictEqual(stays[0].estimatedPricePerNight.amount > 0, true);
  });

  it('should generate fallback stays for unknown destinations', async () => {
    const stays = await stayProvider.searchStays('Zurich, Switzerland');
    assert.strictEqual(stays.length, 2);
    assert.strictEqual(stays[0].destination, 'Zurich, Switzerland');
    assert.strictEqual(stays[0].trustLabel, 'ESTIMATED');
  });

  it('should aggregate destination research insights including best areas to stay', async () => {
    const research = await destinationResearchProvider.getDestinationResearch('Paris, France');
    assert.strictEqual(research.destination, 'Paris, France');
    assert.strictEqual(research.bestAreasToStay.length > 0, true);
    assert.strictEqual(research.topPlaces.length > 0, true);
    assert.strictEqual(research.topStays.length > 0, true);
  });

  it('should validate SAVE_PLACE AI action payload', () => {
    const saveAction = {
      type: 'SAVE_PLACE' as const,
      payload: { name: 'Eiffel Tower', category: 'attraction', estimatedCost: 30 },
    };

    const schemaResult = validateAIAction(saveAction);
    assert.strictEqual(schemaResult.isValid, true);
    assert.strictEqual(schemaResult.action?.type, 'SAVE_PLACE');
  });

  it('should generate ActionProposal for ADD_PLACE_TO_ITINERARY AI action', () => {
    const addPlaceAction = {
      message: 'I have scheduled Eiffel Tower to Day 2.',
      action: {
        type: 'ADD_PLACE_TO_ITINERARY' as const,
        payload: { name: 'Eiffel Tower', dayNumber: 2, startTime: '10:00' },
      },
    };

    const processed = processAIResponse(addPlaceAction, mockTrip);
    assert.strictEqual(processed.message, 'I have scheduled Eiffel Tower to Day 2.');
    assert.notStrictEqual(processed.proposal, undefined);
    assert.strictEqual(processed.proposal?.actionType, 'ADD_PLACE_TO_ITINERARY');
    assert.strictEqual(processed.proposal?.diffSummary[0].newValue.includes('Eiffel Tower'), true);
  });

  it('should generate ActionProposal for ADD_STAY_COST_TO_BUDGET AI action', () => {
    const addStayAction = {
      message: 'Added hotel cost to your accommodation budget.',
      action: {
        type: 'ADD_STAY_COST_TO_BUDGET' as const,
        payload: { name: 'Le Meurice', amount: 900, nights: 2 },
      },
    };

    const processed = processAIResponse(addStayAction, mockTrip);
    assert.strictEqual(processed.message, 'Added hotel cost to your accommodation budget.');
    assert.notStrictEqual(processed.proposal, undefined);
    assert.strictEqual(processed.proposal?.actionType, 'ADD_STAY_COST_TO_BUDGET');
    assert.strictEqual(processed.proposal?.diffSummary[0].newValue.includes('Le Meurice: $900'), true);
  });
});
