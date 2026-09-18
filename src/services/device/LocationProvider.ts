/**
 * LocationProvider
 * 
 * Capability abstraction for traveler geolocation.
 * Supports HTML5 Geolocation (browser/Android WebView) or native GPS bridge.
 * 
 * CORE RULES:
 * - Respects location permissions and privacy.
 * - ZERO FABRICATION: Never invents fake GPS coordinates if denied or unavailable.
 * - Provides clear permission guidance.
 */

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: string;
}

export interface LocationAvailability {
  isAvailable: boolean;
  permissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown';
  disclaimer: string;
}

export interface ILocationProvider {
  checkAvailability(): Promise<LocationAvailability>;
  getCurrentLocation(): Promise<LocationCoordinates>;
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
}

export class BrowserLocationProvider implements ILocationProvider {
  async checkAvailability(): Promise<LocationAvailability> {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      return {
        isAvailable: false,
        permissionStatus: 'unknown',
        disclaimer: 'Geolocation hardware or API is unavailable in this environment.',
      };
    }

    let permissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown' = 'prompt';
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        const res = await (navigator.permissions as any).query({ name: 'geolocation' });
        permissionStatus = res.state || 'prompt';
      } catch {
        permissionStatus = 'unknown';
      }
    }

    return {
      isAvailable: true,
      permissionStatus,
      disclaimer: 'Device location is used solely to center maps and calculate distances to nearby itinerary spots. Coordinates remain local.',
    };
  }

  getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator?.geolocation) {
        reject(new Error('Geolocation is not supported by your browser or device.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
          });
        },
        (error) => {
          let msg = 'Unable to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in your device settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location information is currently unavailable from device sensors.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'The location request timed out.';
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }
}

export const locationProvider: ILocationProvider = new BrowserLocationProvider();
