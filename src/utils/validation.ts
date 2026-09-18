import { TripFormData, FormErrors } from '@/types/trip';

export function validateTripForm(data: Partial<TripFormData>): { isValid: boolean; errors: FormErrors } {
  const errors: FormErrors = {};

  // 1. Trip Name
  if (!data.name || !data.name.trim()) {
    errors.name = 'Trip name is required.';
  } else if (data.name.trim().length < 3) {
    errors.name = 'Trip name must be at least 3 characters.';
  }

  // 2. Destination
  if (!data.destination || !data.destination.trim()) {
    errors.destination = 'Destination is required.';
  }

  // 3. Origin
  if (!data.origin || !data.origin.trim()) {
    errors.origin = 'Origin city/country is required.';
  }

  // 4. Start Date
  if (!data.startDate) {
    errors.startDate = 'Start date is required.';
  }

  // 5. End Date
  if (!data.endDate) {
    errors.endDate = 'End date is required.';
  } else if (data.startDate && new Date(data.endDate) < new Date(data.startDate)) {
    errors.endDate = 'End date cannot be earlier than start date.';
  }

  // 6. Travelers
  if (data.travelers === undefined || data.travelers === null || isNaN(data.travelers)) {
    errors.travelers = 'Number of travelers is required.';
  } else if (data.travelers < 1) {
    errors.travelers = 'Trip must have at least 1 traveler.';
  } else if (!Number.isInteger(Number(data.travelers))) {
    errors.travelers = 'Number of travelers must be a whole integer.';
  }

  // 7. Budget
  if (data.budget !== undefined && data.budget !== null && data.budget !== (' ' as any)) {
    const numBudget = Number(data.budget);
    if (isNaN(numBudget)) {
      errors.budget = 'Budget must be a valid number.';
    } else if (numBudget < 0) {
      errors.budget = 'Budget cannot be negative.';
    }
  }

  // 8. Currency
  if (!data.currency || !data.currency.trim()) {
    errors.currency = 'Currency selection is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateDurationDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start & end day
  return diffDays;
}
