/**
 * DisruptionProvider
 * 
 * Abstraction for external disruption telemetry & user-reported disruption parsing.
 * 
 * CORE RULES:
 * - NEVER fabricate live flight/weather/closure telemetry as real.
 * - Explicitly label data trust: LIVE, CACHED, ESTIMATED, USER_ENTERED, UNKNOWN.
 * - If no live API key is configured, transparently disclose that telemetry is in simulated/demo mode.
 */

import { Disruption, DisruptionType, DisruptionSeverity } from '@/types/disruption';
import { DataTrustLabel, Trip } from '@/types/trip';

export interface FlightStatusResult {
  flightNumber: string;
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'UNKNOWN';
  delayMinutes?: number;
  scheduledArrival?: string;
  estimatedArrival?: string;
  trustLabel: DataTrustLabel;
  disclaimer: string;
}

export interface WeatherForecastResult {
  destination: string;
  date: string;
  condition: string;
  precipitationPercent: number;
  temperatureC: number;
  isAdverse: boolean;
  trustLabel: DataTrustLabel;
  disclaimer: string;
}

export interface VenueStatusResult {
  venueName: string;
  destination: string;
  isOpen: boolean;
  closureReason?: string;
  trustLabel: DataTrustLabel;
  disclaimer: string;
}

export interface IDisruptionProvider {
  checkFlightStatus(flightNumber: string, date: string): Promise<FlightStatusResult>;
  checkWeatherForecast(destination: string, date: string): Promise<WeatherForecastResult>;
  checkVenueStatus(venueName: string, destination: string): Promise<VenueStatusResult>;
  parseUserDisruptionReport(text: string, trip: Trip): Disruption;
  createDemoDisruption(type: 'flight_delay_3h' | 'heavy_rain' | 'venue_closure' | 'missed_train', trip: Trip): Disruption;
}

export const DISRUPTION_PROVIDER_DISCLAIMER = 
  'TravelShield live telemetry APIs are not configured with external credentials. Live telemetry claims are refused. Operating via local deterministic simulations & user-reported observations with transparent trust labeling.';

export class HonestTelemetryDisruptionProvider implements IDisruptionProvider {
  async checkFlightStatus(flightNumber: string, date: string): Promise<FlightStatusResult> {
    const cleanFlight = (flightNumber || 'UNKNOWN').toUpperCase().trim();

    // Deterministic simulation for demo flights, transparently labeled
    if (cleanFlight.includes('AF123') || cleanFlight.includes('DL456')) {
      return {
        flightNumber: cleanFlight,
        status: 'DELAYED',
        delayMinutes: 180,
        scheduledArrival: `${date}T14:30:00Z`,
        estimatedArrival: `${date}T17:30:00Z`,
        trustLabel: 'ESTIMATED',
        disclaimer: 'Simulated benchmark flight telemetry for demonstration. Not connected to real-time ACARS/ADS-B feed.',
      };
    }

    return {
      flightNumber: cleanFlight,
      status: 'UNKNOWN',
      trustLabel: 'UNKNOWN',
      disclaimer: `No live telemetry provider configured for flight ${cleanFlight}. Please report actual flight delays manually.`,
    };
  }

  async checkWeatherForecast(destination: string, date: string): Promise<WeatherForecastResult> {
    // Transparently labeled benchmark
    return {
      destination,
      date,
      condition: 'Intermittent Heavy Rain & Wind',
      precipitationPercent: 85,
      temperatureC: 14,
      isAdverse: true,
      trustLabel: 'ESTIMATED',
      disclaimer: 'Simulated weather observation model. No live meteorological satellite API is active.',
    };
  }

  async checkVenueStatus(venueName: string, destination: string): Promise<VenueStatusResult> {
    return {
      venueName,
      destination,
      isOpen: false,
      closureReason: 'Special strike / municipal closure event reported',
      trustLabel: 'UNKNOWN',
      disclaimer: `Real-time ticketing / gate access telemetry is not connected for ${venueName}. Relying on traveler reports.`,
    };
  }

  parseUserDisruptionReport(text: string, trip: Trip): Disruption {
    const lower = text.toLowerCase();
    const now = new Date().toISOString();
    const today = trip.startDate || now.split('T')[0];

    let type: DisruptionType = 'OTHER';
    let title = 'Travel Disruption';
    let severity: DisruptionSeverity = 'medium';
    let delayMinutes: number | undefined;
    let affectedDate = today;

    // Detect Flight delays
    if (lower.includes('flight') && (lower.includes('delay') || lower.includes('late'))) {
      type = 'FLIGHT_DELAY';
      title = 'Inbound Flight Delayed';
      severity = 'high';

      // Extract hours/minutes if present
      const hourMatch = lower.match(/(\d+)\s*(?:hour|hr|h)/);
      const minMatch = lower.match(/(\d+)\s*(?:min|minute)/);
      if (hourMatch) {
        delayMinutes = parseInt(hourMatch[1], 10) * 60;
      } else if (minMatch) {
        delayMinutes = parseInt(minMatch[1], 10);
      } else {
        delayMinutes = 180; // default 3h
      }
      title = `Flight Delayed by ${delayMinutes >= 60 ? `${Math.round(delayMinutes / 60)}h` : `${delayMinutes}m`}`;
    } else if (lower.includes('flight') && (lower.includes('cancel') || lower.includes('cancelled'))) {
      type = 'FLIGHT_CANCELLED';
      title = 'Flight Cancelled';
      severity = 'critical';
    } else if (lower.includes('train') && (lower.includes('delay') || lower.includes('missed') || lower.includes('cancelled'))) {
      type = lower.includes('missed') ? 'MISSED_CONNECTION' : 'TRAIN_DELAY';
      title = lower.includes('missed') ? 'Missed Train Connection' : 'Train Service Disruption';
      severity = 'high';
      delayMinutes = 90;
    } else if (lower.includes('rain') || lower.includes('weather') || lower.includes('storm')) {
      type = 'WEATHER';
      title = 'Adverse Weather Alert';
      severity = 'medium';
      if (lower.includes('tomorrow') && trip.startDate) {
        const d = new Date(trip.startDate);
        d.setDate(d.getDate() + 1);
        affectedDate = d.toISOString().split('T')[0];
      }
    } else if (lower.includes('closed') || lower.includes('closure') || lower.includes('shut')) {
      type = 'VENUE_CLOSED';
      title = 'Attraction or Venue Closure';
      severity = 'high';
    } else if (lower.includes('remove') || lower.includes('don\'t want') || lower.includes('skip') || lower.includes('cancel activity')) {
      type = 'USER_CHANGE';
      title = 'Traveler Schedule Preference';
      severity = 'low';
    } else if (lower.includes('only') && (lower.includes('hour') || lower.includes('time left'))) {
      type = 'TIME_CONSTRAINT';
      title = 'Remaining Time Constraint';
      severity = 'medium';
      const hourMatch = lower.match(/(\d+)\s*(?:hour|hr|h)/);
      if (hourMatch) {
        delayMinutes = parseInt(hourMatch[1], 10) * 60;
      }
    }

    // Identify affected itinerary items based on the trip schedule
    const affectedItemIds: string[] = [];
    if (trip.itineraryDays && trip.itineraryDays.length > 0) {
      const targetDay = trip.itineraryDays.find(d => d.date === affectedDate) || trip.itineraryDays[0];
      if (targetDay && targetDay.items) {
        targetDay.items.forEach(item => {
          // If delay, items in the early window are affected
          if (delayMinutes && delayMinutes >= 120) {
            affectedItemIds.push(item.id);
          } else if (type === 'WEATHER' && (item.activity.toLowerCase().includes('walk') || item.activity.toLowerCase().includes('park') || item.activity.toLowerCase().includes('outdoor') || item.activity.toLowerCase().includes('cruise'))) {
            affectedItemIds.push(item.id);
          } else if (type === 'VENUE_CLOSED') {
            affectedItemIds.push(item.id);
          }
        });
      }
    }

    return {
      id: `disrupt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tripId: trip.id,
      type,
      title,
      description: text,
      detectedAt: now,
      affectedDate,
      affectedItineraryItemIds: affectedItemIds,
      severity,
      source: 'user_reported',
      status: 'active',
      metadata: {
        delayMinutes,
        rawInput: text,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  createDemoDisruption(
    scenario: 'flight_delay_3h' | 'heavy_rain' | 'venue_closure' | 'missed_train',
    trip: Trip
  ): Disruption {
    const now = new Date().toISOString();
    const day1Date = trip.itineraryDays?.[0]?.date || trip.startDate || now.split('T')[0];
    const day2Date = trip.itineraryDays?.[1]?.date || trip.startDate || now.split('T')[0];

    switch (scenario) {
      case 'flight_delay_3h': {
        const day1Items = trip.itineraryDays?.[0]?.items || [];
        return {
          id: `disrupt_demo_flight_${Date.now()}`,
          tripId: trip.id,
          type: 'FLIGHT_DELAY',
          title: 'Flight Delayed by 3 Hours',
          description: 'Inbound flight AF123 delayed due to air traffic control holds. Projected arrival pushed back 180 minutes.',
          detectedAt: now,
          affectedDate: day1Date,
          affectedItineraryItemIds: day1Items.slice(0, 3).map(i => i.id),
          severity: 'high',
          source: 'demo',
          status: 'active',
          metadata: {
            delayMinutes: 180,
            flightNumber: 'AF123',
            originalArrival: '14:30',
            revisedArrival: '17:30',
          },
          createdAt: now,
          updatedAt: now,
        };
      }

      case 'heavy_rain': {
        const outdoorItems = (trip.itineraryDays?.[1]?.items || []).filter(
          i => i.activity.toLowerCase().includes('walk') ||
               i.activity.toLowerCase().includes('garden') ||
               i.activity.toLowerCase().includes('cruise') ||
               i.activity.toLowerCase().includes('tower')
        );
        return {
          id: `disrupt_demo_rain_${Date.now()}`,
          tripId: trip.id,
          type: 'WEATHER',
          title: 'Heavy Rainfall Warning (Day 2)',
          description: 'Torrential downpours (85% precipitation) forecasted across the afternoon. Outdoor sightseeing compromised.',
          detectedAt: now,
          affectedDate: day2Date,
          affectedItineraryItemIds: outdoorItems.map(i => i.id),
          severity: 'medium',
          source: 'demo',
          status: 'active',
          metadata: {
            weatherCondition: 'Heavy Rain & Wind',
            precipitationPercent: 85,
          },
          createdAt: now,
          updatedAt: now,
        };
      }

      case 'venue_closure': {
        const day1Items = trip.itineraryDays?.[0]?.items || [];
        const museumItem = day1Items.find(i => i.activity.toLowerCase().includes('museum') || i.activity.toLowerCase().includes('louvre')) || day1Items[1];
        return {
          id: `disrupt_demo_venue_${Date.now()}`,
          tripId: trip.id,
          type: 'VENUE_CLOSED',
          title: 'Louvre Museum Unplanned Closure',
          description: 'Staff union municipal action has led to temporary visitor closure for today. Pre-booked ticket rescheduling recommended.',
          detectedAt: now,
          affectedDate: day1Date,
          affectedItineraryItemIds: museumItem ? [museumItem.id] : [],
          severity: 'high',
          source: 'demo',
          status: 'active',
          metadata: {
            venueName: 'Louvre Museum',
            alternativeVenue: 'Musée d\'Orsay or Centre Pompidou',
          },
          createdAt: now,
          updatedAt: now,
        };
      }

      case 'missed_train': {
        const items = trip.itineraryDays?.[0]?.items || [];
        return {
          id: `disrupt_demo_train_${Date.now()}`,
          tripId: trip.id,
          type: 'MISSED_CONNECTION',
          title: 'Missed High-Speed Rail Transfer',
          description: 'Metro connection missed; next high-speed regional connection departs in 90 minutes. Evening plans shifted.',
          detectedAt: now,
          affectedDate: day1Date,
          affectedItineraryItemIds: items.slice(1, 3).map(i => i.id),
          severity: 'medium',
          source: 'demo',
          status: 'active',
          metadata: {
            delayMinutes: 90,
          },
          createdAt: now,
          updatedAt: now,
        };
      }
    }
  }
}

export const disruptionProvider = new HonestTelemetryDisruptionProvider();
