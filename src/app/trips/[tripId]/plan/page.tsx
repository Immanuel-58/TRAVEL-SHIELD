'use client';

import React, { use } from 'react';
import { ItinerarySection } from '@/components/sections/ItinerarySection';

export default function TripPlanPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <ItinerarySection tripId={resolvedParams.tripId} />;
}

