import { 
  ItineraryItem, 
  Stay, 
  RoutePoint, 
  RouteLeg, 
  DayRouteSummary 
} from '@/types/travel';
import { TravelEngine } from '@/services/travel/TravelEngine';

export class RouteService {
  /**
   * Deterministic Haversine distance calculation in kilometers.
   */
  static calculateDistanceKm(
    p1?: { lat: number; lng: number },
    p2?: { lat: number; lng: number }
  ): number {
    if (!p1 || !p2 || typeof p1.lat !== 'number' || typeof p2.lat !== 'number') {
      return 0;
    }

    const R = 6371; // Earth's mean radius in km
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat * (Math.PI / 180)) *
        Math.cos(p2.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Deterministic estimated travel time in minutes based on distance.
   */
  static estimateTravelTimeMinutes(
    distanceKm: number,
    mode: 'transit' | 'walking' | 'driving' = 'transit'
  ): number {
    if (distanceKm <= 0) return 0;

    if (mode === 'walking' || distanceKm <= 1.2) {
      // Walking speed approx 4.5 km/h
      return Math.max(5, Math.round((distanceKm / 4.5) * 60));
    }

    // Urban transit/driving average approx 25 km/h + 5 min waiting buffer
    return Math.max(10, Math.round((distanceKm / 25) * 60) + 5);
  }

  /**
   * Compiles an ordered day itinerary into a structured RouteSummary with legs, distances, and warnings.
   */
  static compileDayRoute(
    items: ItineraryItem[] = [],
    dayNumber = 1,
    date?: string,
    stay?: Stay
  ): DayRouteSummary {
    const activeItems = items.filter(i => i.status !== 'cancelled');
    const points: RoutePoint[] = [];
    const legs: RouteLeg[] = [];
    const warnings: string[] = [];

    // Optional stay point as starting base
    if (stay && stay.coordinates) {
      points.push({
        id: `stay-${stay.id}`,
        name: stay.name,
        type: 'stay',
        coordinates: stay.coordinates,
        address: stay.address || stay.location,
        trustLabel: stay.trustLabel || 'ESTIMATED',
        notes: 'Accommodation / Departure Base',
      });
    }

    // Map itinerary items to RoutePoints
    activeItems.forEach((item, index) => {
      const hasCoords = !!(item.coordinates && typeof item.coordinates.lat === 'number');
      const point: RoutePoint = {
        id: item.id,
        name: item.activity,
        type: 'itinerary',
        coordinates: item.coordinates,
        dayNumber: item.dayNumber || dayNumber,
        time: item.startTime,
        address: item.location,
        trustLabel: item.locationTrustLabel || (hasCoords ? 'ESTIMATED' : 'UNKNOWN'),
        notes: item.notes,
      };
      points.push(point);

      if (!hasCoords) {
        warnings.push(`Day ${dayNumber}: "${item.activity}" does not have verified coordinates (Trust: UNKNOWN). Travel time cannot be estimated.`);
      }
    });

    // Compute consecutive legs between items with valid coordinates
    let totalDistanceKm = 0;
    let totalTravelTimeMinutes = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const fromPoint = points[i];
      const toPoint = points[i + 1];

      if (fromPoint.coordinates && toPoint.coordinates) {
        const dist = this.calculateDistanceKm(fromPoint.coordinates, toPoint.coordinates);
        const mode: 'walking' | 'transit' = dist <= 1.5 ? 'walking' : 'transit';
        const travelTime = this.estimateTravelTimeMinutes(dist, mode);

        legs.push({
          from: fromPoint,
          to: toPoint,
          distanceKm: dist,
          travelTimeMinutes: travelTime,
          mode,
          trustLabel: 'ESTIMATED',
        });

        totalDistanceKm += dist;
        totalTravelTimeMinutes += travelTime;
      }
    }

    // Schedule tightness validation between consecutive itinerary activities
    for (let i = 0; i < activeItems.length - 1; i++) {
      const curr = activeItems[i];
      const next = activeItems[i + 1];

      if (curr.endTime && next.startTime && curr.coordinates && next.coordinates) {
        const currEndMin = TravelEngine.timeToMinutes(curr.endTime);
        const nextStartMin = TravelEngine.timeToMinutes(next.startTime);
        const scheduledGapMin = nextStartMin - currEndMin;

        const dist = this.calculateDistanceKm(curr.coordinates, next.coordinates);
        const estTravelTime = this.estimateTravelTimeMinutes(dist);

        if (scheduledGapMin < estTravelTime) {
          warnings.push(
            `Day ${dayNumber} Schedule Tight: Travel from "${curr.activity}" to "${next.activity}" (${dist} km, ~${estTravelTime} mins) exceeds scheduled break (${Math.max(0, scheduledGapMin)} mins).`
          );
        }
      }
    }

    return {
      dayNumber,
      date,
      points,
      legs,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalTravelTimeMinutes,
      warnings,
      trustLabel: 'ESTIMATED',
    };
  }

  /**
   * Deterministic route sequence optimizer using nearest-neighbor heuristic.
   * Minimizes total travel distance for activities on a given day.
   */
  static optimizeDayItemSequence(items: ItineraryItem[]): {
    optimizedItems: ItineraryItem[];
    originalDistanceKm: number;
    optimizedDistanceKm: number;
    savingsKm: number;
  } {
    const validItems = items.filter(i => i.coordinates && typeof i.coordinates.lat === 'number');
    const invalidItems = items.filter(i => !i.coordinates || typeof i.coordinates.lat !== 'number');

    if (validItems.length <= 2) {
      return {
        optimizedItems: [...items],
        originalDistanceKm: 0,
        optimizedDistanceKm: 0,
        savingsKm: 0,
      };
    }

    // 1. Calculate original distance
    let originalDistance = 0;
    for (let i = 0; i < validItems.length - 1; i++) {
      originalDistance += this.calculateDistanceKm(validItems[i].coordinates, validItems[i + 1].coordinates);
    }

    // 2. Greedy Nearest-Neighbor heuristic starting from first item
    const unvisited = [...validItems];
    const ordered: ItineraryItem[] = [unvisited.shift()!];

    while (unvisited.length > 0) {
      const lastPoint = ordered[ordered.length - 1].coordinates!;
      let bestIndex = 0;
      let minDistance = Infinity;

      for (let j = 0; j < unvisited.length; j++) {
        const d = this.calculateDistanceKm(lastPoint, unvisited[j].coordinates!);
        if (d < minDistance) {
          minDistance = d;
          bestIndex = j;
        }
      }

      ordered.push(unvisited.splice(bestIndex, 1)[0]);
    }

    // 3. Calculate optimized distance
    let optimizedDistance = 0;
    for (let i = 0; i < ordered.length - 1; i++) {
      optimizedDistance += this.calculateDistanceKm(ordered[i].coordinates, ordered[i + 1].coordinates);
    }

    // Append items without coordinates to preserve them
    const resultItems = [...ordered, ...invalidItems];

    return {
      optimizedItems: resultItems,
      originalDistanceKm: Number(originalDistance.toFixed(2)),
      optimizedDistanceKm: Number(optimizedDistance.toFixed(2)),
      savingsKm: Number(Math.max(0, originalDistance - optimizedDistance).toFixed(2)),
    };
  }
}
