'use client';

import React from 'react';
import { useTrip } from '@/context/TripContext';
import { FileLock2, Upload, Lock } from 'lucide-react';

export function DocumentsSection() {
  const { activeTrip } = useTrip();

  if (!activeTrip) return null;

  const docCount = activeTrip.documentsSummary?.totalDocs || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileLock2 size={20} color="var(--accent-indigo)" />
            Privacy Sentinel & Travel Document Vault
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Pipeline: CAPTURE → LOCAL OCR → PII DETECTION → REDACTION → SECURE STORAGE.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-active)' }}>
          <Lock size={32} color="var(--accent-indigo)" />
        </div>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary, #1c1410)' }}>Local Document Vault ({docCount} Protected Files)</h3>
        <p style={{ maxWidth: '520px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Passport OCR and local PII masking pipelines will be integrated in Phase 8.
        </p>
      </div>
    </div>
  );
}

