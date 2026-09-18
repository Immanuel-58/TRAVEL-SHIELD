'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TripRootPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/trips/${resolvedParams.tripId}/overview`);
  }, [resolvedParams.tripId, router]);

  return null;
}
