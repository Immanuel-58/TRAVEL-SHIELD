import { Trip } from '@/types/trip';
import { TripContextData } from './types';

/**
 * Extracts a controlled, sanitized TripContextData object to send to the AI provider.
 * Strips all API keys, raw documents, private PII, and unnecessary credentials.
 */
export function extractTripContext(trip: Trip): TripContextData {
  return {
    id: trip.id,
    name: trip.name,
    origin: trip.origin,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    budget: trip.budget,
    currency: trip.currency,
    travelStyle: trip.travelStyle,
    interests: trip.interests || [],
    status: trip.status,
  };
}
