import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractTripContext } from '../services/ai/tripContext';
import { validateAIAction, validateBusinessRules, processAIResponse } from '../services/ai/pipeline';
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

describe('Phase 3 AI Intelligence & Validation Pipeline', () => {
  it('should extract a controlled, sanitized TripContextData object without secret keys', () => {
    const context = extractTripContext(mockTrip);
    assert.strictEqual(context.id, 'paris-expedition-2026');
    assert.strictEqual(context.name, 'Paris Expedition 2026');
    assert.strictEqual(context.destination, 'Paris, France');
    assert.strictEqual(context.budget, 4500);
    assert.strictEqual(context.travelers, 2);
    // Ensure raw confidential fields or keys are absent
    assert.strictEqual((context as any).apiKey, undefined);
    assert.strictEqual((context as any).passportNumber, undefined);
  });

  it('should validate valid structured AI action payloads', () => {
    const validBudgetAction = {
      type: 'UPDATE_TRIP_BUDGET',
      payload: { amount: 5000, currency: 'USD' },
    };

    const schemaResult = validateAIAction(validBudgetAction);
    assert.strictEqual(schemaResult.isValid, true);
    assert.strictEqual(schemaResult.action?.type, 'UPDATE_TRIP_BUDGET');
    assert.strictEqual(schemaResult.action?.payload.amount, 5000);
  });

  it('should reject malformed or unrecognized AI actions', () => {
    const invalidAction = {
      type: 'MALICIOUS_EXECUTE_SHELL',
      payload: { cmd: 'rm -rf /' },
    };

    const schemaResult = validateAIAction(invalidAction);
    assert.strictEqual(schemaResult.isValid, false);
    assert.match(schemaResult.error || '', /Invalid or unrecognized action type/);
  });

  it('should reject budget updates that violate business constraints (negative values)', () => {
    const action = {
      type: 'UPDATE_TRIP_BUDGET' as const,
      payload: { amount: -500, currency: 'USD' },
    };

    const businessResult = validateBusinessRules(action, mockTrip);
    assert.strictEqual(businessResult.isValid, false);
    assert.strictEqual(businessResult.error, 'Budget cannot be a negative value.');
  });

  it('should generate an ActionProposal card for valid structured actions', () => {
    const aiResponsePayload = {
      message: 'I have updated your target budget as requested.',
      action: {
        type: 'UPDATE_TRIP_BUDGET' as const,
        payload: { amount: 6000, currency: 'USD' },
      },
    };

    const processed = processAIResponse(aiResponsePayload, mockTrip);
    assert.strictEqual(processed.message, 'I have updated your target budget as requested.');
    assert.notStrictEqual(processed.proposal, undefined);
    assert.strictEqual(processed.proposal?.actionType, 'UPDATE_TRIP_BUDGET');
    assert.strictEqual(processed.proposal?.status, 'pending');
    assert.strictEqual(processed.proposal?.diffSummary.length, 1);
    assert.strictEqual(processed.proposal?.diffSummary[0].newValue, 'USD $6,000');
  });
});
