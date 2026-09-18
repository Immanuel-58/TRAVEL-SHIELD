import { MapProviderStatus } from '@/types/travel';

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface IMapProvider {
  getDestinationCentroid(destination: string): { lat: number; lng: number } | undefined;
  getDestinationBounds(destination: string, coordinatesList?: Array<{ lat: number; lng: number }>): MapBounds;
  getProviderStatus(): MapProviderStatus;
}

const DESTINATION_CENTROIDS: Record<string, { lat: number; lng: number; bounds: MapBounds }> = {
  paris: {
    lat: 48.8566,
    lng: 2.3522,
    bounds: { minLat: 48.8155, maxLat: 48.9021, minLng: 2.2241, maxLng: 2.4699 },
  },
  tokyo: {
    lat: 35.6762,
    lng: 139.6503,
    bounds: { minLat: 35.5800, maxLat: 35.7800, minLng: 139.6000, maxLng: 139.8500 },
  },
  london: {
    lat: 51.5074,
    lng: -0.1278,
    bounds: { minLat: 51.4000, maxLat: 51.6000, minLng: -0.3000, maxLng: 0.1000 },
  },
  'new york': {
    lat: 40.7128,
    lng: -74.0060,
    bounds: { minLat: 40.6800, maxLat: 40.8500, minLng: -74.0500, maxLng: -73.9000 },
  },
};

export class FallbackMapProvider implements IMapProvider {
  getDestinationCentroid(destination: string): { lat: number; lng: number } | undefined {
    if (!destination) return undefined;
    const key = destination.toLowerCase().split(',')[0].trim();
    for (const [destKey, data] of Object.entries(DESTINATION_CENTROIDS)) {
      if (key.includes(destKey)) {
        return { lat: data.lat, lng: data.lng };
      }
    }
    return undefined;
  }

  getDestinationBounds(destination: string, coordinatesList?: Array<{ lat: number; lng: number }>): MapBounds {
    // 1. If valid points provided, compute dynamic bounding box with margin
    const validPoints = (coordinatesList || []).filter(
      p => typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)
    );

    if (validPoints.length > 0) {
      let minLat = validPoints[0].lat;
      let maxLat = validPoints[0].lat;
      let minLng = validPoints[0].lng;
      let maxLng = validPoints[0].lng;

      for (const p of validPoints) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
      }

      // Add 15% margin padding
      const latMargin = Math.max((maxLat - minLat) * 0.15, 0.02);
      const lngMargin = Math.max((maxLng - minLng) * 0.15, 0.02);

      return {
        minLat: minLat - latMargin,
        maxLat: maxLat + latMargin,
        minLng: minLng - lngMargin,
        maxLng: maxLng + lngMargin,
      };
    }

    // 2. Lookup curated destination bounds
    if (destination) {
      const key = destination.toLowerCase().split(',')[0].trim();
      for (const [destKey, data] of Object.entries(DESTINATION_CENTROIDS)) {
        if (key.includes(destKey)) {
          return { ...data.bounds };
        }
      }
    }

    // 3. Default fallback bounds
    return {
      minLat: 48.80,
      maxLat: 48.92,
      minLng: 2.20,
      maxLng: 2.50,
    };
  }

  getProviderStatus(): MapProviderStatus {
    return {
      status: 'fallback',
      hasOfflineSupport: true,
      disclaimer: 'Spatial Map Engine (Offline / Fallback). No live third-party tile keys configured. All spatial coordinates and route geometries are computed deterministically.',
      trustLabel: 'ESTIMATED',
    };
  }
}

export const mapProvider = new FallbackMapProvider();
