import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TravelEngine } from '../services/travel/TravelEngine';
import { PlanningService } from '../services/travel/PlanningService';
import { processAIResponse } from '../services/ai/pipeline';
import { Trip } from '../types/trip';

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
};

describe('Phase 4 Travel Intelligence Engine', () => {
  it('should deterministically calculate trip duration in days (inclusive)', () => {
    assert.strictEqual(TravelEngine.calculateTripDuration('2026-06-12', '2026-06-18'), 7);
    assert.strictEqual(TravelEngine.calculateTripDuration('2026-06-12', '2026-06-12'), 1);
    assert.strictEqual(TravelEngine.calculateTripDuration('', ''), 0);
  });

  it('should calculate daily budget rounded to 2 decimal places', () => {
    assert.strictEqual(TravelEngine.calculateDailyBudget(4500, 7), 642.86);
    assert.strictEqual(TravelEngine.calculateDailyBudget(0, 7), 0);
  });

  it('should calculate exactly 10% emergency buffer', () => {
    assert.strictEqual(TravelEngine.calculateEmergencyBuffer(4500, 10), 450);
    assert.strictEqual(TravelEngine.calculateEmergencyBuffer(200000, 10), 20000);
    assert.strictEqual(TravelEngine.calculateEmergencyBuffer(0, 10), 0);
  });

  it('should deterministically calculate remaining budget from total and spent', () => {
    assert.strictEqual(TravelEngine.calculateRemainingBudget(4500, 1200), 3300);
    assert.strictEqual(TravelEngine.calculateRemainingBudget(2000, 2500), -500);
  });

  it('should apply logged expenses to category and recalculate totals', () => {
    const initialPlan = PlanningService.generateInitialTripPlan(mockTrip);
    const updatedBudget = TravelEngine.applyExpense(initialPlan.budget, 'food', 150);

    assert.strictEqual(updatedBudget.actualSpent, 150);
    assert.strictEqual(updatedBudget.remainingBudget, 4500 - 150);

    const foodCat = updatedBudget.categories.find(c => c.category === 'food');
    assert.notStrictEqual(foodCat, undefined);
    assert.strictEqual(foodCat?.spentAmount, 150);
    assert.strictEqual(foodCat?.trustLabel, 'USER_ENTERED');
  });

  it('should detect itinerary schedule overlaps', () => {
    const items = [
      {
        id: 'item-1',
        dayNumber: 1,
        date: '2026-06-12',
        activity: 'Eiffel Tower Tour',
        location: 'Paris',
        startTime: '10:00',
        endTime: '12:30',
        durationMinutes: 150,
        estimatedCost: { amount: 50, currency: 'USD', trustLabel: 'ESTIMATED' as const },
        travelTimeMinutes: 15,
        status: 'planned' as const,
      },
      {
        id: 'item-2',
        dayNumber: 1,
        date: '2026-06-12',
        activity: 'Louvre Museum Visit',
        location: 'Paris',
        startTime: '11:30', // Overlaps with 10:00-12:30!
        endTime: '14:00',
        durationMinutes: 150,
        estimatedCost: { amount: 40, currency: 'USD', trustLabel: 'ESTIMATED' as const },
        travelTimeMinutes: 15,
        status: 'planned' as const,
      },
    ];

    const overlaps = TravelEngine.detectTimeOverlaps(items);
    assert.strictEqual(overlaps.length, 1);
    assert.strictEqual(overlaps[0].item1.activity, 'Eiffel Tower Tour');
    assert.strictEqual(overlaps[0].item2.activity, 'Louvre Museum Visit');
  });

  it('should validate multi-day itinerary schedule and report warnings', () => {
    const days = [
      {
        dayNumber: 1,
        date: '2026-06-12',
        items: [
          {
            id: '1',
            dayNumber: 1,
            date: '2026-06-12',
            activity: 'City Walk',
            location: 'Paris',
            startTime: '10:00',
            endTime: '11:00',
            durationMinutes: 60,
            estimatedCost: { amount: 20, currency: 'USD', trustLabel: 'ESTIMATED' as const },
            travelTimeMinutes: 10,
            status: 'planned' as const,
          },
          {
            id: '2',
            dayNumber: 1,
            date: '2026-06-12',
            activity: 'City Walk', // Duplicate name
            location: 'Paris',
            startTime: '14:00',
            endTime: '15:00',
            durationMinutes: 60,
            estimatedCost: { amount: 20, currency: 'USD', trustLabel: 'ESTIMATED' as const },
            travelTimeMinutes: 10,
            status: 'planned' as const,
          },
        ],
      },
    ];

    const result = TravelEngine.validateItinerarySchedule(days, '2026-06-12', '2026-06-18');
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.warnings.length, 1);
    assert.match(result.warnings[0], /Duplicate activity "City Walk"/);
  });

  it('should process AI actions for itinerary and expenses via pipeline', () => {
    const addItineraryAction = {
      message: 'Added Eiffel Tower to Day 2.',
      action: {
        type: 'ADD_TO_ITINERARY' as const,
        payload: { dayNumber: 2, activity: 'Eiffel Tower Summit', startTime: '10:00', endTime: '12:00', estimatedCost: 45 },
      },
    };

    const processed = processAIResponse(addItineraryAction, mockTrip);
    assert.strictEqual(processed.message, 'Added Eiffel Tower to Day 2.');
    assert.notStrictEqual(processed.proposal, undefined);
    assert.strictEqual(processed.proposal?.actionType, 'ADD_TO_ITINERARY');
    assert.strictEqual(processed.proposal?.diffSummary[0].newValue.includes('Eiffel Tower Summit'), true);
  });
});
