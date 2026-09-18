'use client';

import React from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { calculateDurationDays } from '@/utils/validation';
import { 
  Luggage, 
  Plus, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Receipt, 
  FileText, 
  Camera, 
  AlertTriangle,
  Compass,
  CheckCircle2,
  Lock,
  WifiOff
} from 'lucide-react';

export default function DashboardPage() {
  const { trips, activeTrip, isLoading, error } = useTrip();

  if (isLoading) {
    return <LoadingState message="Loading your travel dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const activeDisruptions = (activeTrip?.disruptions || []).filter(d => d.status === 'active');
  const totalSpent = activeTrip?.expensesSummary?.totalSpent ?? (activeTrip?.expenses || []).reduce((s, e) => s + (e.baseAmount || 0), 0);
  const docsCount = activeTrip?.documentsSummary?.totalDocs ?? (activeTrip?.documents || []).length;
  const hotelSessionsCount = activeTrip?.hotelGuardSummary?.totalInspections ?? (activeTrip?.hotelGuardSessions || []).length;
  const savedResearchCount = (activeTrip?.savedPlaces || []).length + (activeTrip?.savedStays || []).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Dashboard Welcome Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Travel Operating System
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #6b5c4e)', fontSize: '0.92rem', marginTop: '4px' }}>
            Plan, organize, manage, protect, and adapt your complete journey in one workspace.
          </p>
        </div>

        <Link href="/trips/new">
          <Button leftIcon={<Plus size={16} />}>
            Create New Trip
          </Button>
        </Link>
      </div>

      {/* Main Grid: Active/Current Trip Highlight + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Current / Active Trip Workspace Spotlight */}
        <div style={{ gridColumn: 'span 2' }} className="mobile-full">
          {activeTrip ? (
            <Card hoverable onClick={() => window.location.href = `/trips/${activeTrip.id}/overview`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Badge tripStatus={activeTrip.status} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #9a8a7c)' }}>Central Trip Object</span>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>{activeTrip.name}</h2>
                </div>

                <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Open Workspace
                </Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px', background: 'var(--color-surface-muted, #f4f0ea)', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border, #e0d5c8)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #9a8a7c)', display: 'block' }}>Destination</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <MapPin size={14} color="var(--color-accent, #b5541a)" /> {activeTrip.destination}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #9a8a7c)', display: 'block' }}>Travel Dates</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={14} color="var(--color-success, #2d6a4f)" /> {activeTrip.startDate}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #9a8a7c)', display: 'block' }}>Duration</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    {calculateDurationDays(activeTrip.startDate, activeTrip.endDate)} Days
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #9a8a7c)', display: 'block' }}>Target Budget</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-accent, #b5541a)', fontWeight: 700, marginTop: '2px', display: 'block' }}>
                    ${activeTrip.budget.toLocaleString()} {activeTrip.currency}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={<Luggage size={28} />}
              title="No Active Trip Selected"
              description="Create a trip to start planning your itinerary, tracking budget, and protecting your documents."
              actionLabel="Create Your First Trip"
              onAction={() => window.location.href = '/trips/new'}
            />
          )}
        </div>

        {/* Quick Launch Panel */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, marginBottom: '2px' }}>
            Quick Actions
          </h3>

          <Link href="/trips/new" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(181, 84, 26, 0.08)',
              border: '1px solid rgba(181, 84, 26, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-accent, #b5541a)',
            }}>
              <Plus size={18} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary, #1c1410)' }}>Plan New Trip</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>Set up destination, dates & budget</div>
              </div>
            </div>
          </Link>

          <Link href={activeTrip ? `/trips/${activeTrip.id}/documents` : '/documents'} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(45, 106, 79, 0.08)',
              border: '1px solid rgba(45, 106, 79, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-success, #2d6a4f)',
            }}>
              <FileText size={18} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary, #1c1410)' }}>Privacy Sentinel Docs</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>View & mask sensitive document PII</div>
              </div>
            </div>
          </Link>

          <Link href={activeTrip ? `/trips/${activeTrip.id}/hotelguard` : '/trips'} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(184, 112, 32, 0.08)',
              border: '1px solid rgba(184, 112, 32, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-warning, #b87020)',
            }}>
              <Camera size={18} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-primary, #1c1410)' }}>HotelGuard Log</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>Check-in & check-out condition evidence</div>
              </div>
            </div>
          </Link>
        </Card>
      </div>

      {/* 2 Column Section: My Trips List & Subsystem Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* All Trips List */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>My Planned Trips</h3>
            <Link href="/trips" style={{ fontSize: '0.82rem', color: 'var(--color-accent, #b5541a)', fontWeight: 600 }}>
              View All ({trips.length}) →
            </Link>
          </div>

          {trips.length === 0 ? (
            <EmptyState
              title="No Trips Found"
              description="You have not created any trips yet."
              actionLabel="Create Trip"
              onAction={() => window.location.href = '/trips/new'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {trips.map((t) => (
                <div
                  key={t.id}
                  onClick={() => window.location.href = `/trips/${t.id}/overview`}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--color-surface-muted, #f4f0ea)',
                    border: '1px solid var(--color-border, #e0d5c8)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', fontSize: '0.92rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '2px' }}>
                      {t.destination} • {t.startDate}
                    </div>
                  </div>
                  <Badge tripStatus={t.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Live Subsystem Status Tiles */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
            Subsystem Status {activeTrip && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-secondary, #6b5c4e)' }}>({activeTrip.name})</span>}
          </h3>

          {/* Expenses Subsystem */}
          <Link href={activeTrip ? `/trips/${activeTrip.id}/expenses` : '/expenses'} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={15} color="var(--color-accent, #b5541a)" /> Multi-Currency Ledger
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '2px' }}>
                  Total Spent: ${totalSpent.toLocaleString()} {activeTrip?.currency || 'USD'} • {(activeTrip?.expenses || []).length} transactions
                </p>
              </div>
              <ArrowRight size={14} color="var(--color-text-muted, #9a8a7c)" />
            </div>
          </Link>

          {/* Document Vault Subsystem */}
          <Link href={activeTrip ? `/trips/${activeTrip.id}/documents` : '/documents'} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="var(--color-success, #2d6a4f)" /> Document Vault & Privacy Sentinel
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '2px' }}>
                  {docsCount} document(s) stored • Local PII masking active
                </p>
              </div>
              <ArrowRight size={14} color="var(--color-text-muted, #9a8a7c)" />
            </div>
          </Link>

          {/* HotelGuard Subsystem */}
          <Link href={activeTrip ? `/trips/${activeTrip.id}/hotelguard` : '/trips'} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={15} color="var(--color-warning, #b87020)" /> HotelGuard Inspection Evidence
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '2px' }}>
                  {hotelSessionsCount} room inspection session(s) recorded
                </p>
              </div>
              <ArrowRight size={14} color="var(--color-text-muted, #9a8a7c)" />
            </div>
          </Link>

          {/* Disruptions & Replanning Subsystem */}
          <Link href={activeTrip ? `/trips/${activeTrip.id}/disruptions` : '/trips'} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} color={activeDisruptions.length > 0 ? "var(--color-warning, #b87020)" : "var(--color-success, #2d6a4f)"} /> Disruption Center & Replanning
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '2px' }}>
                  {activeDisruptions.length > 0 ? `${activeDisruptions.length} active disruption(s) detected` : 'Operating normally • 0 schedule conflicts'}
                </p>
              </div>
              <ArrowRight size={14} color="var(--color-text-muted, #9a8a7c)" />
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
}
