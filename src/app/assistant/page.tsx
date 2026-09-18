'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, ArrowRight, Plus, MapPin } from 'lucide-react';

export default function GlobalAssistantPage() {
  const { trips, activeTrip, setActiveTripId } = useTrip();
  const router = useRouter();

  // If there is an active trip, automatically route to its assistant workspace
  useEffect(() => {
    if (activeTrip) {
      router.replace(`/trips/${activeTrip.id}/assistant`);
    } else if (trips.length > 0) {
      router.replace(`/trips/${trips[0].id}/assistant`);
    }
  }, [activeTrip, trips, router]);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--color-accent, #b5541a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
            TravelShield AI Assistant
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #6b5c4e)', fontSize: '0.9rem' }}>
            Select a trip workspace below to launch intelligent planning, budget analysis, and replanning.
          </p>
        </div>
      </div>

      {trips.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <Sparkles size={36} color="var(--color-accent, #b5541a)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, marginBottom: '6px' }}>
            No Trips Available Yet
          </h3>
          <p style={{ color: 'var(--color-text-secondary, #6b5c4e)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Create your first travel workspace to start planning with the AI companion.
          </p>
          <Link href="/trips/new">
            <Button leftIcon={<Plus size={16} />}>
              Create New Trip
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trips.map(trip => (
            <Card
              key={trip.id}
              hoverable
              onClick={() => {
                setActiveTripId(trip.id);
                router.push(`/trips/${trip.id}/assistant`);
              }}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)' }}>
                    {trip.name}
                  </span>
                  <Badge tripStatus={trip.status} />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #6b5c4e)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} color="var(--color-accent, #b5541a)" /> {trip.destination} • {trip.startDate} → {trip.endDate} • Budget: ${trip.budget.toLocaleString()} {trip.currency}
                </div>
              </div>

              <Button size="sm" rightIcon={<ArrowRight size={14} />}>
                Open Assistant
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
