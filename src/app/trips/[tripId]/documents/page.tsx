'use client';

import React, { use } from 'react';
import { DocumentVaultSection } from '@/components/sections/DocumentVaultSection';

export default function TripDocumentsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  return <DocumentVaultSection tripId={resolvedParams.tripId} />;
}
