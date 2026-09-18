import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateTripForm, calculateDurationDays } from '../utils/validation';

describe('Trip Form Validation', () => {
  it('should validate a valid trip form payload', () => {
    const validData = {
      name: 'Tokyo Tech Summit',
      origin: 'San Francisco, CA',
      destination: 'Tokyo, Japan',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      travelers: 2,
      budget: 5000,
      currency: 'USD',
      travelStyle: 'balanced',
      interests: ['technology', 'food'],
    };

    const result = validateTripForm(validData);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(Object.keys(result.errors).length, 0);
  });

  it('should reject empty required fields', () => {
    const emptyData = {};
    const result = validateTripForm(emptyData);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errors.name, 'Trip name is required.');
    assert.strictEqual(result.errors.destination, 'Destination is required.');
    assert.strictEqual(result.errors.origin, 'Origin city/country is required.');
    assert.strictEqual(result.errors.startDate, 'Start date is required.');
    assert.strictEqual(result.errors.endDate, 'End date is required.');
  });

  it('should reject end date before start date', () => {
    const invalidDates = {
      name: 'Paris Tour',
      origin: 'London',
      destination: 'Paris',
      startDate: '2026-10-15',
      endDate: '2026-10-10', // 5 days earlier!
      travelers: 1,
      budget: 1000,
      currency: 'EUR',
    };

    const result = validateTripForm(invalidDates);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errors.endDate, 'End date cannot be earlier than start date.');
  });

  it('should reject invalid traveler counts', () => {
    const invalidTravelers = {
      name: 'Solo Trip',
      origin: 'NYC',
      destination: 'Miami',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      travelers: 0, // invalid
      currency: 'USD',
    };

    const result = validateTripForm(invalidTravelers);
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.errors.travelers, 'Trip must have at least 1 traveler.');
  });

  it('should calculate duration in days correctly', () => {
    assert.strictEqual(calculateDurationDays('2026-06-12', '2026-06-18'), 7);
    assert.strictEqual(calculateDurationDays('2026-06-12', '2026-06-12'), 1);
    assert.strictEqual(calculateDurationDays('2026-06-18', '2026-06-12'), 0);
  });
});

