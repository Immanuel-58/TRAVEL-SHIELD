'use client';

import React from 'react';
import { Trip } from '@/types/trip';
import { calculateDurationDays } from '@/utils/validation';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Calendar, Users, Wallet } from 'lucide-react';

export interface TripWorkspaceHeaderProps {
  trip: Trip;
}

export function TripWorkspaceHeader({ trip }: TripWorkspaceHeaderProps) {
  const durationDays = calculateDurationDays(trip.startDate, trip.endDate);

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px 28px',
      marginBottom: '16px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Badge tripStatus={trip.status} />
            <Badge variant="neutral">{durationDays > 0 ? `${durationDays} Days` : 'Multi-day'}</Badge>
            <Badge trustLabel="USER_ENTERED" />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-heading-xl)',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-heading)',
            marginBottom: '8px',
            lineHeight: 'var(--leading-heading)',
          }}>
            {trip.name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} color="var(--color-accent)" />
              {trip.destination} <span style={{ color: 'var(--color-text-muted)', marginLeft: '3px' }}>from {trip.origin}</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} color="var(--color-success)" />
              {trip.startDate} ? {trip.endDate}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Users size={14} color="var(--color-warning)" />
              {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
            </span>
          </div>
        </div>

        {trip.budget > 0 && (
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-muted)',
            border: '1px solid var(--color-border)',
            textAlign: 'right',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <Wallet size={11} /> Target Budget
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
              ${trip.budget.toLocaleString()}
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400, marginLeft: '4px' }}>{trip.currency}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
