'use client';

import React, { use } from 'react';
import { BudgetSection } from '@/components/sections/BudgetSection';

export default function TripBudgetPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <BudgetSection tripId={resolvedParams.tripId} />;
}

