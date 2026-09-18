'use client';

import React, { use } from 'react';
import { MapSection } from '@/components/sections/MapSection';

export default function TripMapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <MapSection tripId={resolvedParams.tripId} />
    </div>
  );
}
