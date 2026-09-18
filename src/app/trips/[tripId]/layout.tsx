'use client';

import React, { use } from 'react';
import { useTrip } from '@/context/TripContext';
import { TripWorkspaceHeader } from '@/components/shell/TripWorkspaceHeader';
import { TripWorkspaceNav } from '@/components/shell/TripWorkspaceNav';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function TripWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.tripId;
  const { getTripById, isLoading } = useTrip();

  if (isLoading) {
    return <LoadingState message="Loading Trip Workspace..." />;
  }

  const trip = getTripById(tripId);

  if (!trip) {
    return (
      <ErrorState
        title="Trip Not Found"
        message={`No trip workspace was found matching ID "${tripId}".`}
        onRetry={() => window.location.href = '/trips'}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TripWorkspaceHeader trip={trip} />
      <TripWorkspaceNav tripId={trip.id} />
      <main style={{ minHeight: '400px' }}>
        {children}
      </main>
    </div>
  );
}
