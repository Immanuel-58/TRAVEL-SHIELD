'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateDurationDays } from '@/utils/validation';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Wallet, 
  Plane, 
  Hotel, 
  Compass, 
  CalendarDays, 
  Sparkles, 
  ShieldCheck,
  FileLock2,
  Camera,
  Info
} from 'lucide-react';

export default function TripOverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  const { getTripById } = useTrip();
  const trip = getTripById(resolvedParams.tripId);

  if (!trip) return null;

  const durationDays = calculateDurationDays(trip.startDate, trip.endDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Grid Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Destination Card */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <span>Destination</span>
            <MapPin size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', marginTop: '6px' }}>
            {trip.destination}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Origin: {trip.origin}
          </div>
        </Card>

        {/* Duration Card */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <span>Travel Window</span>
            <Calendar size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', marginTop: '6px' }}>
            {durationDays} Days
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {trip.startDate} → {trip.endDate}
          </div>
        </Card>

        {/* Travelers Card */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <span>Party Size</span>
            <Users size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', marginTop: '6px' }}>
            {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Style: {trip.travelStyle.toUpperCase()}
          </div>
        </Card>

        {/* Budget Summary Card */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            <span>Allocated Budget</span>
            <Wallet size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '6px' }}>
            ${trip.budget.toLocaleString()} {trip.currency}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Deterministic rule active
          </div>
        </Card>
      </div>

      {/* 2 Column Main Layout: Summaries & Placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }} className="mobile-single-col">
        {/* Left Column: Itinerary, Flights, Stays Summaries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Important Travel Information Card */}
          <Card>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--accent-cyan)" />
              Trip Overview & Preferences
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.88rem' }} className="mobile-single-col">
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>Primary Interests</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {trip.interests.map((interest) => (
                    <Badge key={interest} variant="neutral">{interest}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>Trip Status & Data Trust</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <Badge tripStatus={trip.status} />
                  <Badge trustLabel="USER_ENTERED" />
                </div>
              </div>
            </div>
          </Card>

          {/* Flight Summary Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plane size={18} color="var(--accent-cyan)" /> Flight & Travel Allocation
              </h3>
              <span className="badge-trust badge-trust-estimated">ESTIMATED</span>
            </div>
            {(() => {
              const flightCat = trip.structuredBudget?.categories?.find(c => c.category === 'flights');
              const allocated = flightCat?.allocatedAmount || Math.round(trip.budget * 0.3);
              return (
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)' }}>
                    ${allocated.toLocaleString()} {trip.currency}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Allocated flight budget from {trip.origin} to {trip.destination}.
                  </p>
                </div>
              );
            })()}
          </Card>

          {/* Accommodation Summary Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hotel size={18} color="var(--accent-emerald)" /> Accommodation Allocation
              </h3>
              <span className="badge-trust badge-trust-estimated">ESTIMATED</span>
            </div>
            {(() => {
              const hotelCat = trip.structuredBudget?.categories?.find(c => c.category === 'accommodation');
              const allocated = hotelCat?.allocatedAmount || Math.round(trip.budget * 0.35);
              return (
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)' }}>
                    ${allocated.toLocaleString()} {trip.currency}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Allocated stay budget for {durationDays} days in {trip.destination}.
                  </p>
                </div>
              );
            })()}
          </Card>

          {/* Upcoming Itinerary Highlight Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} color="var(--accent-amber)" /> Upcoming Activity & Highlights
              </h3>
              <Link href={`/trips/${trip.id}/plan`}>
                <Button variant="ghost" size="sm">Go to Plan →</Button>
              </Link>
            </div>
            {(() => {
              const allItems = (trip.itineraryDays || []).flatMap(d => d.items || []);
              const upcomingItem = allItems.find(i => i.status === 'planned') || allItems[0];

              if (!upcomingItem) {
                return (
                  <EmptyState
                    icon={<CalendarDays size={24} />}
                    title="No Activities Scheduled Yet"
                    description="Visit the Plan tab to schedule day-by-day activities."
                  />
                );
              }

              return (
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '4px' }}>
                    NEXT SCHEDULED EVENT • Day {upcomingItem.dayNumber}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)' }}>
                    {upcomingItem.activity}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>📍 {upcomingItem.location || trip.destination}</span>
                    <span>⏰ {upcomingItem.startTime} - {upcomingItem.endTime}</span>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>

        {/* Right Column: Subsystems status & Quick launch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* AI Assistant Banner */}
          <Card style={{ background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--border-active)' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-cyan)" /> AI Companion
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Your intelligent travel assistant center will be activated in Phase 3.
            </p>
            <Link href={`/trips/${trip.id}/assistant`}>
              <Button size="sm" variant="outline" style={{ width: '100%' }}>
                Open AI Assistant
              </Button>
            </Link>
          </Card>

          {/* HotelGuard Check-in Evidence Placeholder */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} color="var(--accent-amber)" /> HotelGuard Proof
              </h3>
              <span className="badge-trust badge-trust-offline">Phase 9</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Check-in and check-out room condition logs with SHA-256 cryptographic signatures will appear here.
            </p>
            <Link href={`/trips/${trip.id}/hotelguard`} style={{ marginTop: '12px', display: 'block' }}>
              <Button size="sm" variant="secondary" style={{ width: '100%' }}>
                HotelGuard Vault
              </Button>
            </Link>
          </Card>

          {/* Privacy Sentinel Docs Placeholder */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileLock2 size={16} color="var(--accent-emerald)" /> Privacy Vault
              </h3>
              <span className="badge-trust badge-trust-offline">Phase 8</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Local OCR & PII redaction pipeline for passport and travel documents will be managed here.
            </p>
            <Link href={`/trips/${trip.id}/documents`} style={{ marginTop: '12px', display: 'block' }}>
              <Button size="sm" variant="secondary" style={{ width: '100%' }}>
                Documents Vault
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
