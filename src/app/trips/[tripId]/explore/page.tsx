'use client';

import React, { use } from 'react';
import { ExploreSection } from '@/components/sections/ExploreSection';

export default function TripExplorePage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <ExploreSection tripId={resolvedParams.tripId} />;
}

