'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { TripStatus } from '@/types/trip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { calculateDurationDays } from '@/utils/validation';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  Wallet, 
  Trash2, 
  Luggage,
  RotateCcw
} from 'lucide-react';

export default function MyTripsPage() {
  const { trips, isLoading, deleteTrip, setActiveTripId, resetDemoData } = useTrip();
  const [filter, setFilter] = useState<'all' | TripStatus>('all');

  if (isLoading) {
    return <LoadingState message="Loading your trips..." />;
  }

  const filteredTrips = filter === 'all' 
    ? trips 
    : trips.filter(t => t.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
            My Trips
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
            Manage all your active, upcoming, and past travel workspaces.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetDemoData}>
            Reset Seed Data
          </Button>
          <Link href="/trips/new">
            <Button leftIcon={<Plus size={16} />}>
              Create New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Segment Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {(['all', 'active', 'upcoming', 'completed'] as const).map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setFilter(statusKey)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: filter === statusKey ? 600 : 500,
              color: filter === statusKey ? '#ffffff' : 'var(--text-secondary)',
              background: filter === statusKey ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
              border: filter === statusKey ? '1px solid var(--border-active)' : '1px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {statusKey} ({statusKey === 'all' ? trips.length : trips.filter(t => t.status === statusKey).length})
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <EmptyState
          icon={<Luggage size={32} />}
          title={`No ${filter !== 'all' ? filter : ''} trips found`}
          description="You haven't added any trips in this category yet."
          actionLabel="Create a Trip"
          onAction={() => window.location.href = '/trips/new'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredTrips.map((trip) => {
            const days = calculateDurationDays(trip.startDate, trip.endDate);
            return (
              <Card
                key={trip.id}
                hoverable
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <Badge tripStatus={trip.status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete trip "${trip.name}"?`)) {
                          deleteTrip(trip.id);
                        }
                      }}
                      style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }}
                      title="Delete trip"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, marginBottom: '6px' }}>
                    {trip.name}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--accent-cyan)" />
                      <span>{trip.destination} (from {trip.origin})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--accent-emerald)" />
                      <span>{trip.startDate} → {trip.endDate} ({days} days)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} color="var(--accent-amber)" /> {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
                      </span>
                      {trip.budget > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600 }}>
                          <Wallet size={14} color="var(--accent-cyan)" /> ${trip.budget.toLocaleString()} {trip.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Created {new Date(trip.createdAt).toLocaleDateString()}
                  </span>

                  <Link href={`/trips/${trip.id}/overview`}>
                    <Button size="sm" onClick={() => setActiveTripId(trip.id)}>
                      Open Workspace
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
