'use client';

import React from 'react';
import { useOffline } from '@/context/OfflineContext';
import { useTrip } from '@/context/TripContext';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function OfflineBanner() {
  const {
    isOffline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    pendingSyncCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    activePack,
  } = useOffline();
  const { activeTrip } = useTrip();

  if (!isOffline && pendingSyncCount === 0 && !lastSyncResult?.conflictCount) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: isOffline ? 'var(--color-warning-soft, #fdf0d8)' : 'var(--color-surface, #ffffff)',
        borderBottom: '1px solid var(--color-border, #e0d5c8)',
        borderLeft: isOffline ? '4px solid var(--color-warning, #b87020)' : '4px solid var(--color-success, #2d6a4f)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: 'var(--text-body-sm, 0.85rem)',
        color: 'var(--color-text-primary, #1c1410)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {isOffline ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning, #b87020)', fontWeight: 700 }}>
            <WifiOff size={16} />
            <span>OFFLINE MODE</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success, #2d6a4f)', fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>CONNECTED</span>
          </div>
        )}

        <span style={{ color: 'var(--color-text-secondary, #6b5c4e)' }}>
          {isOffline ? (
            activePack ? (
              <>Your saved trip for <strong>{activePack.destination}</strong> is available offline.</>
            ) : (
              <>Offline. Open Trip Workspace to view locally cached sections.</>
            )
          ) : (
            <>Internet connection restored.</>
          )}
        </span>

        {isSimulatedOffline && (
          <Badge variant="amber" style={{ fontSize: '0.68rem' }}>
            Simulated Network Mode
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {pendingSyncCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent, #b5541a)' }}>
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>
              {isSyncing
                ? 'Syncing changes...'
                : `${pendingSyncCount} change${pendingSyncCount !== 1 ? 's' : ''} waiting to sync`}
            </span>
          </div>
        )}

        {!isOffline && pendingSyncCount > 0 && activeTrip && (
          <button
            onClick={() => triggerSync(activeTrip)}
            disabled={isSyncing}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--color-accent, #b5541a)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
            }}
          >
            Sync Now
          </button>
        )}

        {lastSyncResult && lastSyncResult.conflictCount > 0 && (
          <span style={{ color: 'var(--color-danger, #a82020)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={13} />
            {lastSyncResult.conflictCount} conflict needs review
          </span>
        )}

        <button
          onClick={toggleSimulatedOffline}
          style={{
            fontSize: '0.75rem',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--color-border, #e0d5c8)',
            background: 'var(--color-surface-muted, #f4f0ea)',
            color: 'var(--color-text-secondary, #6b5c4e)',
            cursor: 'pointer',
          }}
          title="Toggle browser network simulation"
        >
          {isSimulatedOffline ? 'Resume Real Online' : 'Simulate Offline'}
        </button>
      </div>
    </div>
  );
}
