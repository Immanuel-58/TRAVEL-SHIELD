'use client';

import React, { use } from 'react';
import { HotelGuardSection } from '@/components/sections/HotelGuardSection';

export default function TripHotelGuardPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <HotelGuardSection tripId={resolvedParams.tripId} />;
}
