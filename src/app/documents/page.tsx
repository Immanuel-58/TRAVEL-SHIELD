'use client';

import React from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileLock2, FileText, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export default function GlobalDocumentsPage() {
  const { trips } = useTrip();

  const tripsWithDocs = trips.filter(t => t.documents && t.documents.length > 0);
  const totalDocs = trips.reduce((sum, t) => sum + (t.documents?.length || 0), 0);
  const sensitiveCount = trips.reduce((sum, t) =>
    sum + (t.documents?.filter(d =>
      d.privacyStatus === 'SENSITIVE_DATA_FOUND' || d.privacyStatus === 'USER_REVIEW_REQUIRED'
    ).length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <FileLock2 size={22} color="var(--accent-indigo)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Document Vault — Overview</h1>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Documents are stored per-trip. Go to a Trip Workspace to upload, scan, and manage documents.
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <FileText size={22} color="var(--accent-indigo)" style={{ marginBottom: '6px' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalDocs}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Documents</div>
        </div>
        <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
          <ShieldCheck size={22} color="#34d399" style={{ marginBottom: '6px' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{tripsWithDocs.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Trips with Docs</div>
        </div>
        {sensitiveCount > 0 && (
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.3)' }}>
            <AlertTriangle size={22} color="#fbbf24" style={{ marginBottom: '6px' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>{sensitiveCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Need Review</div>
          </div>
        )}
      </div>

      {/* Per-trip document list */}
      {trips.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No trips found. Create a trip to start uploading documents.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trips.map(trip => {
            const docs = trip.documents || [];
            const tripSensitive = docs.filter(d =>
              d.privacyStatus === 'SENSITIVE_DATA_FOUND' || d.privacyStatus === 'USER_REVIEW_REQUIRED'
            ).length;
            return (
              <div key={trip.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{trip.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{trip.destination}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge variant="neutral">{docs.length} doc{docs.length !== 1 ? 's' : ''}</Badge>
                  {tripSensitive > 0 && <Badge variant="amber">{tripSensitive} need review</Badge>}
                </div>
                <Link href={`/trips/${trip.id}/documents`}>
                  <Button size="sm" variant="outline" rightIcon={<ArrowRight size={13} />}>
                    Open Vault
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
