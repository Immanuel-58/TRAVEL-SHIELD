'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { mapProvider } from '@/services/map/MapProvider';
import { RouteService } from '@/services/map/RouteService';
import { locationProvider } from '@/services/device/LocationProvider';
import { RoutePoint, Stay, Place } from '@/types/travel';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ExternalLink, 
  Bookmark, 
  Bed, 
  Route, 
  Sparkles,
  Info
} from 'lucide-react';

interface MapSectionProps {
  tripId?: string;
  initialDay?: number;
  highlightItemId?: string;
}

export function MapSection({ tripId, initialDay, highlightItemId }: MapSectionProps) {
  const { activeTrip, getTripById, reorderItineraryDay } = useTrip();
  const trip = tripId ? getTripById(tripId) : activeTrip;

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'all'>(initialDay || 1);
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [layerFilter, setLayerFilter] = useState<'all' | 'itinerary' | 'places' | 'stays'>('all');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const handleLocateMe = async () => {
    try {
      setGpsStatus('Acquiring GPS...');
      const loc = await locationProvider.getCurrentLocation();
      setGpsStatus(`Current location: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)} (±${Math.round(loc.accuracyMeters)}m)`);
      setPanOffset({ x: 0, y: 0 });
      setZoomLevel(1.2);
    } catch (err: any) {
      setGpsStatus(err.message || 'GPS location unavailable');
    }
  };

  const providerStatus = useMemo(() => mapProvider.getProviderStatus(), []);

  // 1. Gather all points from Itinerary, Saved Places, and Saved Stays
  const { allPoints, unmappedItems } = useMemo(() => {
    if (!trip) return { allPoints: [], unmappedItems: [] };

    const points: RoutePoint[] = [];
    const unmapped: Array<{ id: string; name: string; type: string; day?: number }> = [];

    // Add Itinerary items
    (trip.itineraryDays || []).forEach(day => {
      (day.items || []).forEach(item => {
        if (item.coordinates && typeof item.coordinates.lat === 'number') {
          points.push({
            id: item.id,
            name: item.activity,
            type: 'itinerary',
            coordinates: item.coordinates,
            dayNumber: day.dayNumber,
            time: item.startTime,
            address: item.location,
            trustLabel: item.locationTrustLabel || 'ESTIMATED',
            notes: item.notes,
          });
        } else {
          unmapped.push({
            id: item.id,
            name: item.activity,
            type: 'Itinerary Stop',
            day: day.dayNumber,
          });
        }
      });
    });

    // Add Saved Places
    (trip.savedPlaces || []).forEach((place: Place) => {
      if (place.coordinates && typeof place.coordinates.lat === 'number') {
        points.push({
          id: `place-${place.id}`,
          name: place.name,
          type: 'place',
          coordinates: place.coordinates,
          address: place.address,
          trustLabel: place.trustLabel || 'ESTIMATED',
          notes: place.description,
        });
      } else {
        unmapped.push({
          id: place.id,
          name: place.name,
          type: 'Saved Place',
        });
      }
    });

    // Add Saved Stays
    (trip.savedStays || []).forEach((stay: Stay) => {
      if (stay.coordinates && typeof stay.coordinates.lat === 'number') {
        points.push({
          id: `stay-${stay.id}`,
          name: stay.name,
          type: 'stay',
          coordinates: stay.coordinates,
          address: stay.address || stay.location,
          trustLabel: stay.trustLabel || 'ESTIMATED',
          notes: `Accommodation: ${stay.location}`,
        });
      }
    });

    return { allPoints: points, unmappedItems: unmapped };
  }, [trip]);

  // 2. Filter points based on selected day and layer filter
  const visiblePoints = useMemo(() => {
    return allPoints.filter(pt => {
      if (layerFilter === 'itinerary' && pt.type !== 'itinerary') return false;
      if (layerFilter === 'places' && pt.type !== 'place') return false;
      if (layerFilter === 'stays' && pt.type !== 'stay') return false;

      if (selectedDayNumber !== 'all' && pt.type === 'itinerary') {
        return pt.dayNumber === selectedDayNumber;
      }
      return true;
    });
  }, [allPoints, selectedDayNumber, layerFilter]);

  // 3. Compile day route summary for active day
  const dayRouteSummary = useMemo(() => {
    if (!trip || selectedDayNumber === 'all') return null;

    const dayObj = (trip.itineraryDays || []).find(d => d.dayNumber === selectedDayNumber);
    if (!dayObj) return null;

    const primaryStay = trip.savedStays && trip.savedStays.length > 0 ? trip.savedStays[0] : undefined;
    return RouteService.compileDayRoute(dayObj.items, selectedDayNumber, dayObj.date, primaryStay);
  }, [trip, selectedDayNumber]);

  // 4. Compute bounding box for projection
  const bounds = useMemo(() => {
    if (!trip) return { minLat: 48.8, maxLat: 48.9, minLng: 2.2, maxLng: 2.5 };

    const coordsList = visiblePoints
      .filter(p => p.coordinates)
      .map(p => p.coordinates!);

    return mapProvider.getDestinationBounds(trip.destination, coordsList);
  }, [trip, visiblePoints]);

  // Handle Optimize Route
  const handleOptimizeRoute = () => {
    if (!trip || selectedDayNumber === 'all') return;
    setIsOptimizing(true);

    const dayObj = (trip.itineraryDays || []).find(d => d.dayNumber === selectedDayNumber);
    if (dayObj && dayObj.items) {
      const opt = RouteService.optimizeDayItemSequence(dayObj.items);
      const orderedIds = opt.optimizedItems.map(i => i.id);
      reorderItineraryDay(trip.id, selectedDayNumber, orderedIds);
    }

    setTimeout(() => {
      setIsOptimizing(false);
    }, 400);
  };

  if (!trip) {
    return (
      <Card style={{ padding: '40px' }}>
        <EmptyState
          icon={<MapPin size={32} color="var(--accent-cyan)" />}
          title="No Active Trip Selected"
          description="Select a trip from your workspace to view its spatial map and location-aware routes."
        />
      </Card>
    );
  }

  // Coordinate projection helper: converts Lat/Lng to SVG Canvas percentage (0 to 100)
  const projectCoordinates = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 0.05;
    const lngSpan = bounds.maxLng - bounds.minLng || 0.05;

    // Invert lat because SVG Y coordinates go downwards
    const x = ((lng - bounds.minLng) / lngSpan) * 80 + 10;
    const y = (1 - (lat - bounds.minLat) / latSpan) * 80 + 10;

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const daysCount = trip.itineraryDays?.length || 7;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <Card style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Badge variant="cyan" style={{ fontSize: '0.72rem' }}>PHASE 6 • LOCATION INTELLIGENCE</Badge>
              <span className={`badge-trust badge-trust-${providerStatus.trustLabel.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                {providerStatus.trustLabel}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={22} color="var(--accent-cyan)" />
              {trip.destination} Spatial Map & Route Visualizer
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Deterministic geographic coordinates, sequential itinerary routes, and travel-time estimates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant={layerFilter === 'all' ? 'primary' : 'outline'}
              onClick={() => setLayerFilter('all')}
            >
              All Pins ({allPoints.length})
            </Button>
            <Button
              size="sm"
              variant={layerFilter === 'itinerary' ? 'primary' : 'outline'}
              onClick={() => setLayerFilter('itinerary')}
            >
              Itinerary
            </Button>
            <Button
              size="sm"
              variant={layerFilter === 'places' ? 'primary' : 'outline'}
              onClick={() => setLayerFilter('places')}
            >
              Saved Places
            </Button>
            <Button
              size="sm"
              variant={layerFilter === 'stays' ? 'primary' : 'outline'}
              onClick={() => setLayerFilter('stays')}
            >
              Stays
            </Button>
          </div>
        </div>
      </Card>

      {/* Provider Disclaimer Notice */}
      <div style={{
        padding: '10px 16px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={14} color="var(--accent-cyan)" />
          <span>{providerStatus.disclaimer}</span>
        </div>
        <Badge variant="neutral" style={{ fontSize: '0.7rem' }}>Offline Ready</Badge>
      </div>

      {/* Day Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setSelectedDayNumber('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: selectedDayNumber === 'all' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
            background: selectedDayNumber === 'all' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: selectedDayNumber === 'all' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontWeight: selectedDayNumber === 'all' ? 700 : 500,
            fontSize: '0.82rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          All Days Overview
        </button>

        {Array.from({ length: daysCount }).map((_, idx) => {
          const dayNum = idx + 1;
          const isSelected = selectedDayNumber === dayNum;
          return (
            <button
              key={dayNum}
              onClick={() => setSelectedDayNumber(dayNum)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Day {dayNum}
            </button>
          );
        })}
      </div>

      {/* Day Route Statistics Bar */}
      {dayRouteSummary && (
        <Card style={{ padding: '14px 20px', background: 'rgba(0, 0, 0, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>DAY STOPS</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)' }}>
                  {dayRouteSummary.points.length} locations
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL ROUTE DISTANCE</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {dayRouteSummary.totalDistanceKm} km
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>EST. TRANSIT TIME</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  ~{dayRouteSummary.totalTravelTimeMinutes} mins
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sparkles size={14} color="var(--accent-cyan)" />}
              isLoading={isOptimizing}
              onClick={handleOptimizeRoute}
            >
              Optimize Sequence
            </Button>
          </div>

          {/* Route Warnings */}
          {dayRouteSummary.warnings.length > 0 && (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {dayRouteSummary.warnings.map((warn, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Main Interactive Spatial Map Canvas */}
      <Card style={{ padding: '0px', overflow: 'hidden', position: 'relative', minHeight: '440px' }}>
        {/* Map Control Toolbar */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '6px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={() => setZoomLevel(z => Math.min(z + 0.25, 2.5))}
            style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-primary, #1c1410)', cursor: 'pointer', borderRadius: '4px' }}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.75))}
            style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-primary, #1c1410)', cursor: 'pointer', borderRadius: '4px' }}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
            style={{ padding: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-primary, #1c1410)', cursor: 'pointer', borderRadius: '4px' }}
            title="Recenter"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {gpsStatus && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            zIndex: 10,
            background: 'var(--color-surface, #ffffff)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #e0d5c8)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-accent, #b5541a)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {gpsStatus}
          </div>
        )}
        {/* Compass Cardinal Heading Indicator */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '6px 10px',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
        }}>
          <Compass size={14} color="var(--accent-cyan)" />
          <span>N 0° • {trip.destination}</span>
        </div>

        {/* SVG Spatial Canvas */}
        <div style={{
          width: '100%',
          height: '460px',
          background: 'radial-gradient(ellipse at center, #111c30 0%, #090e17 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <defs>
              {/* Grid pattern */}
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.3" />
              </pattern>
              {/* Route line glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background grid */}
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Concentric distance reference rings from center */}
            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="0.4" strokeDasharray="1,1" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(14, 165, 233, 0.05)" strokeWidth="0.4" strokeDasharray="1,1" />

            {/* Route Polylines connecting sequential itinerary items */}
            {dayRouteSummary && dayRouteSummary.legs.map((leg, idx) => {
              if (!leg.from.coordinates || !leg.to.coordinates) return null;
              const p1 = projectCoordinates(leg.from.coordinates.lat, leg.from.coordinates.lng);
              const p2 = projectCoordinates(leg.to.coordinates.lat, leg.to.coordinates.lng);

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g key={`leg-${idx}`}>
                  {/* Glowing route line */}
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="var(--accent-cyan)"
                    strokeWidth="1.2"
                    strokeDasharray="2,1"
                    filter="url(#glow)"
                  />
                  {/* Distance label midway */}
                  <circle cx={midX} cy={midY} r="2.2" fill="#0f172a" stroke="var(--accent-cyan)" strokeWidth="0.4" />
                  <text
                    x={midX}
                    y={midY + 0.8}
                    fontSize="1.6"
                    fill="#38bdf8"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {leg.distanceKm}k
                  </text>
                </g>
              );
            })}

            {/* Render Pins */}
            {visiblePoints.map((pt, idx) => {
              if (!pt.coordinates) return null;
              const pos = projectCoordinates(pt.coordinates.lat, pt.coordinates.lng);
              const isSelected = selectedPoint?.id === pt.id;

              // Color based on type
              let pinColor = '#38bdf8'; // itinerary default cyan
              let ringColor = 'rgba(56, 189, 248, 0.4)';
              if (pt.type === 'stay') {
                pinColor = '#a855f7'; // stay purple
                ringColor = 'rgba(168, 85, 247, 0.4)';
              } else if (pt.type === 'place') {
                pinColor = '#f59e0b'; // saved place amber
                ringColor = 'rgba(245, 158, 11, 0.4)';
              }

              return (
                <g
                  key={pt.id}
                  onClick={() => setSelectedPoint(pt)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pulse ring when selected */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="5.5"
                      fill="none"
                      stroke={pinColor}
                      strokeWidth="0.6"
                      opacity="0.8"
                    />
                  )}

                  {/* Marker outer ring */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? "3.6" : "3.0"}
                    fill="#0f172a"
                    stroke={pinColor}
                    strokeWidth={isSelected ? "1.0" : "0.7"}
                  />

                  {/* Marker center dot / label */}
                  {pt.type === 'itinerary' && pt.dayNumber !== undefined ? (
                    <text
                      x={pos.x}
                      y={pos.y + 1.1}
                      fontSize="2.4"
                      fill={pinColor}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {idx + 1}
                    </text>
                  ) : (
                    <circle cx={pos.x} cy={pos.y} r="1.2" fill={pinColor} />
                  )}

                  {/* Marker label below */}
                  <text
                    x={pos.x}
                    y={pos.y + 4.8}
                    fontSize="2.0"
                    fill="#e2e8f0"
                    textAnchor="middle"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    style={{ textShadow: '0 1px 3px #000' }}
                  >
                    {pt.name.length > 18 ? `${pt.name.slice(0, 16)}...` : pt.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* Selected Marker Detail Card */}
      {selectedPoint && (
        <Card style={{ padding: '18px 22px', border: '1px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Badge variant={selectedPoint.type === 'stay' ? 'neutral' : 'cyan'}>
                  {selectedPoint.type.toUpperCase()}
                </Badge>
                {selectedPoint.dayNumber && (
                  <Badge variant="neutral">Day {selectedPoint.dayNumber}</Badge>
                )}
                <span className={`badge-trust badge-trust-${selectedPoint.trustLabel.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                  {selectedPoint.trustLabel}
                </span>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)' }}>
                {selectedPoint.name}
              </h3>

              {selectedPoint.address && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <MapPin size={13} color="var(--accent-cyan)" />
                  {selectedPoint.address}
                </div>
              )}

              {selectedPoint.coordinates && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  GPS: {selectedPoint.coordinates.lat.toFixed(4)}°, {selectedPoint.coordinates.lng.toFixed(4)}°
                </div>
              )}

              {selectedPoint.notes && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                  {selectedPoint.notes}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedPoint.coordinates && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.coordinates.lat},${selectedPoint.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="sm" variant="outline" leftIcon={<ExternalLink size={14} />}>
                    Open in External Maps
                  </Button>
                </a>
              )}

              {selectedPoint.type === 'itinerary' && (
                <Link href={`/trips/${trip.id}/plan`} style={{ textDecoration: 'none' }}>
                  <Button size="sm" variant="secondary" leftIcon={<Calendar size={14} />}>
                    View in Itinerary
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Unmapped Items Notice (when coordinates are UNKNOWN) */}
      {unmappedItems.length > 0 && (
        <Card style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={15} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)' }}>
              Unmapped Activities & Places ({unmappedItems.length})
            </span>
            <span className="badge-trust badge-trust-unknown" style={{ fontSize: '0.66rem' }}>
              UNKNOWN
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            The following items do not have verified coordinates and cannot be mapped or routed until location details are confirmed:
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unmappedItems.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {item.day ? `Day ${item.day}: ` : ''}{item.name}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
