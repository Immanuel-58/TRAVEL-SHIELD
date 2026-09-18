'use client';

import React, { use } from 'react';
import { ExpensesSection } from '@/components/sections/ExpensesSection';

export default function TripExpensesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <ExpensesSection tripId={resolvedParams.tripId} />;
}

