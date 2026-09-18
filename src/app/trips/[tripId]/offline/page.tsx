'use client';

import React, { use } from 'react';
import { OfflineSection } from '@/components/sections/OfflineSection';

export default function TripOfflinePage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <OfflineSection tripId={resolvedParams.tripId} />;
}
