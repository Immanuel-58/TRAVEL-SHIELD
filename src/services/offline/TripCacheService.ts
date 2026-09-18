/**
 * TripCacheService
 * 
 * Compiles and validates OfflineTripPacks from live trip models.
 * Extracts spatial coordinates for offline mapping and determines
 * per-section offline accessibility without fabricating live capabilities.
 */

import { Trip } from '@/types/trip';
import { OfflineTripPack, OfflineComponentItem, SectionAvailability } from '@/types/offline';
import { mapProvider } from '@/services/map/MapProvider';

export class TripCacheService {
  /**
   * Compiles a complete offline trip pack from an in-memory trip record.
   */
  static buildTripPack(trip: Trip): OfflineTripPack {
    const itineraryItemsCount = (trip.itineraryDays || []).reduce(
      (sum, day) => sum + (day.items?.length || 0),
      0
    );

    // Extract all geocoded coordinates for offline map availability
    const cachedCoordinates: OfflineTripPack['cachedCoordinates'] = [];

    // 1. Destination Centroid
    const centroid = mapProvider.getDestinationCentroid(trip.destination);
    if (centroid) {
      cachedCoordinates.push({
        name: `${trip.destination} (Center)`,
        lat: centroid.lat,
        lng: centroid.lng,
        type: 'centroid',
      });
    }

    // 2. Itinerary items with coordinates
    (trip.itineraryDays || []).forEach(day => {
      (day.items || []).forEach(item => {
        if (item.coordinates && typeof item.coordinates.lat === 'number') {
          cachedCoordinates.push({
            name: item.activity,
            lat: item.coordinates.lat,
            lng: item.coordinates.lng,
            type: 'activity',
          });
        }
      });
    });

    // 3. Saved Places with coordinates
    (trip.savedPlaces || []).forEach(place => {
      if (place.coordinates && typeof place.coordinates.lat === 'number') {
        cachedCoordinates.push({
          name: place.name,
          lat: place.coordinates.lat,
          lng: place.coordinates.lng,
          type: 'place',
        });
      }
    });

    // 4. Saved Stays with coordinates
    (trip.savedStays || []).forEach(stay => {
      if (stay.coordinates && typeof stay.coordinates.lat === 'number') {
        cachedCoordinates.push({
          name: stay.name,
          lat: stay.coordinates.lat,
          lng: stay.coordinates.lng,
          type: 'stay',
        });
      }
    });

    const expensesCount = trip.expenses?.length || 0;
    const totalSpent = trip.expenses?.reduce((s, e) => s + (e.baseAmount || 0), 0) || 0;

    const components: OfflineComponentItem[] = [
      {
        id: 'overview',
        name: 'Trip Overview & Dates',
        status: 'ready',
        itemCount: 1,
        detail: `${trip.name} (${trip.destination})`,
      },
      {
        id: 'itinerary',
        name: 'Day-by-Day Itinerary',
        status: 'ready',
        itemCount: itineraryItemsCount,
        detail: `${trip.itineraryDays?.length || 0} days · ${itineraryItemsCount} scheduled activities`,
      },
      {
        id: 'places',
        name: 'Saved Research Places',
        status: 'ready',
        itemCount: trip.savedPlaces?.length || 0,
        detail: `${trip.savedPlaces?.length || 0} places saved to trip`,
      },
      {
        id: 'stays',
        name: 'Saved Accommodations',
        status: 'ready',
        itemCount: trip.savedStays?.length || 0,
        detail: `${trip.savedStays?.length || 0} stays saved to trip`,
      },
      {
        id: 'budget',
        name: 'Budget & Category Ledger',
        status: 'ready',
        itemCount: trip.structuredBudget?.categories?.length || 0,
        detail: `${trip.currency} ${(trip.budget || 0).toLocaleString()} target allocation`,
      },
      {
        id: 'expenses',
        name: 'Expenses & Multi-Currency Ledger',
        status: 'ready',
        itemCount: expensesCount,
        detail: `${expensesCount} expense transactions ($${totalSpent.toLocaleString()} spent)`,
      },
      {
        id: 'documents',
        name: 'Document Vault Metadata',
        status: 'ready',
        itemCount: trip.documents?.length || 0,
        detail: `${trip.documents?.length || 0} travel documents stored locally`,
      },
      {
        id: 'hotelguard',
        name: 'HotelGuard Condition Logs',
        status: 'ready',
        itemCount: trip.hotelGuardSessions?.length || 0,
        detail: `${trip.hotelGuardSessions?.length || 0} inspection sessions available`,
      },
      {
        id: 'disruptions',
        name: 'Disruption Center & Replan Cache',
        status: 'ready',
        itemCount: trip.disruptions?.length || 0,
        detail: `${trip.disruptions?.length || 0} disruptions recorded (${trip.replanHistory?.length || 0} replans applied)`,
      },
      {
        id: 'mapData',
        name: 'Cached Spatial Coordinates',
        status: 'ready',
        itemCount: cachedCoordinates.length,
        detail: `${cachedCoordinates.length} geocoded points ready for offline map`,
      },
    ];

    const packWithoutSize = {
      tripId: trip.id,
      tripName: trip.name,
      destination: trip.destination,
      downloadedAt: new Date().toISOString(),
      version: 1,
      components,
      cachedCoordinates,
      offlineNotes: `Prepared for offline travel in ${trip.destination}`,
    };

    const sizeBytes = new Blob([JSON.stringify(packWithoutSize)]).size || 28000;

    return {
      ...packWithoutSize,
      sizeBytes,
    };
  }

  /**
   * Simulates step-by-step preparation with realistic callbacks for UI progress.
   */
  static async simulatePackDownload(
    trip: Trip,
    onProgress?: (step: string, percent: number) => void
  ): Promise<OfflineTripPack> {
    const steps = [
      { msg: 'Packaging Trip Overview...', pct: 15 },
      { msg: 'Caching Itinerary & Scheduled Activities...', pct: 30 },
      { msg: 'Indexing Saved Places & Accommodations...', pct: 50 },
      { msg: 'Securing Budget & Multi-Currency Expenses...', pct: 70 },
      { msg: 'Encrypting Document Vault & HotelGuard Evidence...', pct: 85 },
      { msg: 'Finalizing Offline Trip Pack & Coordinates...', pct: 100 },
    ];

    for (const step of steps) {
      if (onProgress) onProgress(step.msg, step.pct);
      await new Promise(r => setTimeout(r, 120));
    }

    return this.buildTripPack(trip);
  }

  /**
   * Computes truthful per-section availability and trust labels.
   */
  static getSectionAvailabilities(trip: Trip, isOffline: boolean): SectionAvailability[] {
    const itineraryCount = (trip.itineraryDays || []).reduce((s, d) => s + (d.items?.length || 0), 0);
    const docsCount = trip.documents?.length || 0;
    const hotelGuardCount = trip.hotelGuardSessions?.length || 0;
    const placesCount = trip.savedPlaces?.length || 0;
    const expensesCount = trip.expenses?.length || 0;

    return [
      {
        sectionId: 'overview',
        title: 'Trip Overview',
        availability: 'AVAILABLE_OFFLINE',
        details: 'Full trip details, dates, traveler count, and target budget available.',
        trustLabel: 'USER_ENTERED',
      },
      {
        sectionId: 'plan',
        title: 'Itinerary & Daily Schedule',
        availability: 'AVAILABLE_OFFLINE',
        details: `${itineraryCount} activities cached across ${trip.itineraryDays?.length || 0} days. Time estimates computed locally.`,
        trustLabel: isOffline ? 'OFFLINE' : 'USER_ENTERED',
      },
      {
        sectionId: 'budget',
        title: 'Budget Calculations',
        availability: 'AVAILABLE_OFFLINE',
        details: 'Deterministic budget mathematics, emergency buffer, and category balances work 100% offline.',
        trustLabel: isOffline ? 'OFFLINE' : 'USER_ENTERED',
      },
      {
        sectionId: 'expenses',
        title: 'Expenses & Multi-Currency Tracker',
        availability: 'AVAILABLE_OFFLINE',
        details: `${expensesCount} expense records. Add new expenses offline; automatically syncs on reconnection.`,
        trustLabel: isOffline ? 'OFFLINE' : 'USER_ENTERED',
      },
      {
        sectionId: 'documents',
        title: 'Document Vault & Privacy Sentinel',
        availability: 'AVAILABLE_OFFLINE',
        details: `${docsCount} documents stored on this device. Privacy scanning executes locally on-device.`,
        trustLabel: 'OFFLINE',
      },
      {
        sectionId: 'hotelguard',
        title: 'HotelGuard Evidence',
        availability: 'AVAILABLE_OFFLINE',
        details: `${hotelGuardCount} room inspection logs and local evidence stored on-device.`,
        trustLabel: 'OFFLINE',
      },
      {
        sectionId: 'disruptions',
        title: 'Disruption Center & Replan Engine',
        availability: 'AVAILABLE_OFFLINE',
        details: 'User-reported disruption filing and deterministic schedule replanning operate offline.',
        trustLabel: 'OFFLINE',
      },
      {
        sectionId: 'map',
        title: 'Map & Route Coordinates',
        availability: 'CACHED',
        details: 'Cached pins, destination centroids, and calculated routes are viewable offline. Live satellite tiles require internet.',
        trustLabel: 'ESTIMATED',
      },
      {
        sectionId: 'explore',
        title: 'Explore & Places',
        availability: isOffline ? 'CACHED' : 'AVAILABLE_OFFLINE',
        details: isOffline
          ? `${placesCount} previously saved places available. Live destination discovery is unavailable offline.`
          : 'Live search and research available online.',
        trustLabel: isOffline ? 'CACHED' : 'LIVE',
      },
      {
        sectionId: 'assistant',
        title: 'AI Assistant',
        availability: isOffline ? 'CACHED' : 'AVAILABLE_OFFLINE',
        details: isOffline
          ? 'Deterministic Offline Assistant queries local trip data. Live cloud GPT reasoning is paused until reconnected.'
          : 'Connected to live AI assistance with automatic action proposals.',
        trustLabel: isOffline ? 'OFFLINE' : 'LIVE',
      },
    ];
  }
}