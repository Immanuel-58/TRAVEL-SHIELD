'use client';

import React, { use } from 'react';
import { DisruptionsSection } from '@/components/sections/DisruptionsSection';

export default function TripDisruptionsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <DisruptionsSection tripId={resolvedParams.tripId} />;
}
