import { Trip } from '@/types/trip';
import { 
  StructuredBudget, 
  CategoryAllocation, 
  ItineraryDay, 
  ItineraryItem, 
  PlanningProposalResult 
} from '@/types/travel';
import { TravelEngine } from './TravelEngine';

export class PlanningService {
  /**
   * Generates a deterministic initial planning proposal including budget category allocations,
   * emergency buffer (10%), day-by-day itinerary outline, warnings, and explicit assumptions.
   */
  static generateInitialTripPlan(trip: Trip): PlanningProposalResult {
    const durationDays = TravelEngine.calculateTripDuration(trip.startDate, trip.endDate) || 7;
    const totalBudget = trip.budget || 2500;
    const currency = trip.currency || 'USD';
    const travelStyle = trip.travelStyle || 'balanced';
    const interests = trip.interests && trip.interests.length > 0 ? trip.interests : ['Culture', 'Food'];

    // 1. Calculate Emergency Buffer (10%)
    const emergencyBuffer = TravelEngine.calculateEmergencyBuffer(totalBudget, 10);
    const allocatableBudget = totalBudget - emergencyBuffer;

    // 2. Determine Category Percentages based on Travel Style
    let percentages: Record<string, number>;
    switch (travelStyle.toLowerCase()) {
      case 'luxury':
        percentages = { accommodation: 45, flights: 25, food: 15, activities: 10, local_transport: 5 };
        break;
      case 'budget':
        percentages = { accommodation: 30, flights: 30, food: 20, local_transport: 10, activities: 10 };
        break;
      case 'adventure':
        percentages = { activities: 35, accommodation: 25, flights: 25, food: 10, local_transport: 5 };
        break;
      default: // balanced
        percentages = { accommodation: 35, flights: 30, food: 15, activities: 12, local_transport: 8 };
        break;
    }

    const categories: CategoryAllocation[] = Object.entries(percentages).map(([catKey, pct]) => {
      const allocatedAmount = Number(((allocatableBudget * pct) / 100).toFixed(2));
      return {
        category: catKey as any,
        name: catKey.replace('_', ' ').toUpperCase(),
        allocatedAmount,
        estimatedCost: allocatedAmount,
        spentAmount: 0,
        trustLabel: 'ESTIMATED',
      };
    });

    const estimatedTotal = TravelEngine.calculateTotalEstimatedBudget(categories);
    const remainingBudget = TravelEngine.calculateRemainingBudget(totalBudget, estimatedTotal);

    const structuredBudget: StructuredBudget = {
      totalBudget,
      estimatedTotal,
      actualSpent: 0,
      remainingBudget,
      emergencyBuffer,
      currency,
      trustLabel: 'ESTIMATED',
      categories,
    };

    // 3. Generate Day-by-Day Itinerary Outline with Spatial Coordinates
    const itineraryDays: ItineraryDay[] = [];
    const startDateObj = new Date(trip.startDate || '2026-06-12');
    const isParis = (trip.destination || '').toLowerCase().includes('paris');
    const isTokyo = (trip.destination || '').toLowerCase().includes('tokyo');

    for (let dayIndex = 0; dayIndex < durationDays; dayIndex++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + dayIndex);
      const dateStr = currentDate.toISOString().split('T')[0];

      const items: ItineraryItem[] = [];

      if (dayIndex === 0) {
        // Arrival Day
        const coords1 = isParis ? { lat: 48.8656, lng: 2.3298 } : isTokyo ? { lat: 35.6881, lng: 139.7645 } : undefined;
        const coords2 = isParis ? { lat: 48.8606, lng: 2.3376 } : isTokyo ? { lat: 35.6938, lng: 139.7034 } : undefined;

        items.push({
          id: `item-${dayIndex}-1`,
          dayNumber: dayIndex + 1,
          date: dateStr,
          activity: `Arrival & Check-in at ${trip.destination}`,
          location: `${trip.destination} Main Terminal / Hotel`,
          coordinates: coords1,
          locationTrustLabel: coords1 ? 'ESTIMATED' : 'UNKNOWN',
          startTime: '10:00',
          endTime: '12:00',
          durationMinutes: 120,
          estimatedCost: { amount: 50, currency, trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 45,
          notes: 'Collect baggage, transfer to accommodation, and settle in.',
          status: 'planned',
        });
        items.push({
          id: `item-${dayIndex}-2`,
          dayNumber: dayIndex + 1,
          date: dateStr,
          activity: `Welcome Dinner & Local Exploration`,
          location: `${trip.destination} City Center`,
          coordinates: coords2,
          locationTrustLabel: coords2 ? 'ESTIMATED' : 'UNKNOWN',
          startTime: '18:00',
          endTime: '20:30',
          durationMinutes: 150,
          estimatedCost: { amount: 60, currency, trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 20,
          notes: `Explore local cuisine focusing on ${interests[0] || 'gastronomy'}.`,
          status: 'planned',
        });
      } else if (dayIndex === durationDays - 1) {
        // Departure Day
        const coords1 = isParis ? { lat: 48.8640, lng: 2.3490 } : isTokyo ? { lat: 35.7148, lng: 139.7967 } : undefined;
        const coords2 = isParis ? { lat: 49.0097, lng: 2.5479 } : isTokyo ? { lat: 35.7720, lng: 140.3929 } : undefined;

        items.push({
          id: `item-${dayIndex}-1`,
          dayNumber: dayIndex + 1,
          date: dateStr,
          activity: 'Souvenir Shopping & Final Walkthrough',
          location: `${trip.destination} Market District`,
          coordinates: coords1,
          locationTrustLabel: coords1 ? 'ESTIMATED' : 'UNKNOWN',
          startTime: '09:30',
          endTime: '11:30',
          durationMinutes: 120,
          estimatedCost: { amount: 40, currency, trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 15,
          notes: 'Pick up gifts and pack baggage.',
          status: 'planned',
        });
        items.push({
          id: `item-${dayIndex}-2`,
          dayNumber: dayIndex + 1,
          date: dateStr,
          activity: `Airport Transfer & Departure to ${trip.origin}`,
          location: `${trip.destination} Airport`,
          coordinates: coords2,
          locationTrustLabel: coords2 ? 'ESTIMATED' : 'UNKNOWN',
          startTime: '13:00',
          endTime: '16:00',
          durationMinutes: 180,
          estimatedCost: { amount: 45, currency, trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 60,
          notes: 'Check-in 3 hours before departure flight.',
          status: 'planned',
        });
      } else {
        // Full Sightseeing Days
        const interestFocus = interests[(dayIndex - 1) % interests.length] || 'City Highlights';
        const coords1 = isParis 
          ? (dayIndex % 2 === 1 ? { lat: 48.8584, lng: 2.2945 } : { lat: 48.8867, lng: 2.3431 })
          : isTokyo 
          ? (dayIndex % 2 === 1 ? { lat: 35.6595, lng: 139.7005 } : { lat: 35.6983, lng: 139.7731 })
          : undefined;
        const coords2 = isParis 
          ? (dayIndex % 2 === 1 ? { lat: 48.8590, lng: 2.2960 } : { lat: 48.8575, lng: 2.3622 })
          : isTokyo 
          ? (dayIndex % 2 === 1 ? { lat: 35.6628, lng: 139.7038 } : { lat: 35.7100, lng: 139.8107 })
          : undefined;

        items.push({
          id: `item-${dayIndex}-1`,
          dayNumber: dayIndex + 1,
          date: dateStr,
          activity: `${interestFocus} Morning Tour`,
          location: `${trip.destination} Historic District`,
          coordinates: coords1,
          locationTrustLabel: coords1 ? 'ESTIMATED' : 'UNKNOWN',
          startTime: '09:00',
          endTime: '12:00',
          durationMinutes: 180,
          estimatedCost: { amount: 35, currency, trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 20,
          notes: `Guided exploration focusing on ${interestFocus}.`,
          status: 'planned',
        });
        items.push({
          id: `item-${dayIndex}-2`,
          dayNumber: dayIndex + 1,
          date: dateStr,
          activity: 'Local Landmark & Cultural Visit',
          location: `${trip.destination} Cultural Hub`,
          coordinates: coords2,
          locationTrustLabel: coords2 ? 'ESTIMATED' : 'UNKNOWN',
          startTime: '14:00',
          endTime: '17:00',
          durationMinutes: 180,
          estimatedCost: { amount: 30, currency, trustLabel: 'ESTIMATED' },
          travelTimeMinutes: 15,
          notes: 'Visit top rated points of interest.',
          status: 'planned',
        });
      }

      itineraryDays.push({
        dayNumber: dayIndex + 1,
        date: dateStr,
        items,
      });
    }

    // 4. Generate Planning Warnings & Explicit Assumptions
    const warnings: string[] = [];
    const dailyBudget = TravelEngine.calculateDailyBudget(totalBudget, durationDays);

    if (dailyBudget < 40) {
      warnings.push(`Target daily budget of $${dailyBudget}/day is tight for ${trip.destination}. Consider adjusting accommodation style.`);
    }

    const assumptions = [
      `All budget allocations are model estimates marked with ESTIMATED trust labels.`,
      `Includes a 10% emergency reserve fund ($${emergencyBuffer.toLocaleString()} ${currency}).`,
      `Itinerary activities are structured for ${trip.travelers} traveler(s) over ${durationDays} days.`,
      `No live flight or accommodation booking APIs are claimed; external prices must be verified.`,
    ];

    const tripSummary = `Deterministic ${durationDays}-day plan for ${trip.name} (${trip.destination}). Total Budget: $${totalBudget.toLocaleString()} ${currency} with $${emergencyBuffer.toLocaleString()} emergency buffer.`;

    return {
      tripSummary,
      budget: structuredBudget,
      itineraryDays,
      planningWarnings: warnings,
      assumptions,
    };
  }
}
