'use client';

import React, { useState } from 'react';
import { useTrip } from '@/context/TripContext';
import { useOffline } from '@/context/OfflineContext';
import { TripCacheService } from '@/services/offline/TripCacheService';
import { localAIProvider } from '@/services/ai/LocalAIProvider';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  WifiOff,
  Wifi,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  HardDrive,
  Cpu,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  Shield,
  Send,
} from 'lucide-react';

export function OfflineSection({ tripId }: { tripId: string }) {
  const { getTripById } = useTrip();
  const trip = getTripById(tripId);

  const {
    isOffline,
    isSimulatedOffline,
    toggleSimulatedOffline,
    activePack,
    packStatus,
    downloadProgress,
    downloadTripPack,
    removeTripPack,
    syncQueue,
    pendingSyncCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    queueOfflineAction,
    capabilities,
  } = useOffline();

  const [offlineQuery, setOfflineQuery] = useState('');
  const [offlineQueryResult, setOfflineQueryResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [testActionNote, setTestActionNote] = useState('');

  if (!trip) return null;

  const sectionAvailabilities = TripCacheService.getSectionAvailabilities(trip, isOffline);

  const handleDownload = async () => {
    await downloadTripPack(trip);
  };

  const handleRunOfflineQuery = async (queryText?: string) => {
    const q = queryText || offlineQuery;
    if (!q.trim()) return;
    setIsQuerying(true);
    setOfflineQueryResult(null);

    try {
      const response = await localAIProvider.sendMessage(
        [{ id: `q-${Date.now()}`, role: 'user', content: q.trim(), timestamp: new Date().toISOString() }],
        trip as any
      );
      setOfflineQueryResult(response.message);
    } catch (err: any) {
      setOfflineQueryResult(`Error processing local query: ${err?.message}`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQueueTestAction = () => {
    const note = testActionNote.trim() || `Offline test note created at ${new Date().toLocaleTimeString()}`;
    queueOfflineAction(trip.id, 'ADD_ITINERARY_ITEM', {
      dayNumber: 1,
      item: {
        activity: note,
        location: trip.destination,
        startTime: '16:00',
        endTime: '17:00',
        durationMinutes: 60,
        estimatedCost: { amount: 0, currency: trip.currency, trustLabel: 'OFFLINE' },
        status: 'planned',
      },
    });
    setTestActionNote('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 24px)' }}>
      {/* Top Banner / Status Overview */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--color-border, #e0d5c8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {isOffline ? (
                <Badge variant="amber">? OFFLINE MODE ACTIVE</Badge>
              ) : (
                <Badge variant="emerald">? ONLINE &amp; SYNCHRONIZED</Badge>
              )}
              {activePack ? (
                <Badge variant="emerald">? OFFLINE PACK READY</Badge>
              ) : (
                <Badge variant="neutral">PACK NOT DOWNLOADED</Badge>
              )}
              <Badge trustLabel={isOffline ? 'OFFLINE' : 'LIVE'} />
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-heading-xl, 1.75rem)',
              fontWeight: 800,
              color: 'var(--color-text-primary, #1c1410)',
              marginBottom: '6px',
            }}>
              Offline Intelligence &amp; Local Pack
            </h1>
            <p style={{ color: 'var(--color-text-secondary, #6b5c4e)', fontSize: '0.9rem', maxWidth: '680px' }}>
              Prepare your trip for flight mode and remote destinations. Cache your complete itinerary, places, budget math, and documents on your device.
            </p>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={toggleSimulatedOffline}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: isSimulatedOffline ? 'var(--color-warning-soft, #fdf0d8)' : 'var(--color-surface-muted, #f4f0ea)',
                border: '1px solid var(--color-border, #e0d5c8)',
                color: 'var(--color-text-primary, #1c1410)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSimulatedOffline ? <WifiOff size={15} color="var(--color-warning)" /> : <Wifi size={15} />}
              <span>{isSimulatedOffline ? 'Simulating Offline' : 'Simulate Offline'}</span>
            </button>

            {activePack ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => removeTripPack(trip.id)}
                leftIcon={<Trash2 size={16} />}
              >
                Delete Pack
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleDownload}
                isLoading={packStatus === 'DOWNLOADING'}
                leftIcon={<Download size={16} />}
              >
                Download Trip Pack
              </Button>
            )}
          </div>
        </div>

        {/* Download progress bar */}
        {packStatus === 'DOWNLOADING' && downloadProgress && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--color-surface-muted, #f4f0ea)', borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <span>{downloadProgress.message}</span>
              <span>{downloadProgress.percent}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--color-border, #e0d5c8)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${downloadProgress.percent}%`,
                  height: '100%',
                  background: 'var(--color-accent, #b5541a)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Active Pack Metadata Cards */}
        {activePack && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border, #e0d5c8)',
          }}>
            <div style={{ background: 'var(--color-surface-muted, #f4f0ea)', padding: '12px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Pack Size</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {(activePack.sizeBytes / 1024).toFixed(1)} KB
              </div>
            </div>
            <div style={{ background: 'var(--color-surface-muted, #f4f0ea)', padding: '12px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Cached Locations</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {activePack.cachedCoordinates?.length || 0} Points
              </div>
            </div>
            <div style={{ background: 'var(--color-surface-muted, #f4f0ea)', padding: '12px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Version</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                v{activePack.version}.0 (Offline Ready)
              </div>
            </div>
            <div style={{ background: 'var(--color-surface-muted, #f4f0ea)', padding: '12px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Downloaded</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '3px' }}>
                {new Date(activePack.downloadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Section Availability & Local AI / Sync Manager */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-lg, 24px)' }}>
        
        {/* Left Column: Section-by-Section Availability */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HardDrive size={18} color="var(--color-accent, #b5541a)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              Section-by-Section Offline Status
            </h2>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Truthful breakdown of which TravelShield features function completely offline vs. require internet connectivity.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sectionAvailabilities.map((sec) => (
              <div
                key={sec.sectionId}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  background: 'var(--color-surface-muted, #f4f0ea)',
                  border: '1px solid var(--color-border, #e0d5c8)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                      {sec.title}
                    </span>
                    <Badge trustLabel={sec.trustLabel} />
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    {sec.details}
                  </p>
                </div>

                <div>
                  {sec.availability === 'AVAILABLE_OFFLINE' && (
                    <Badge variant="emerald">Available</Badge>
                  )}
                  {sec.availability === 'CACHED' && (
                    <Badge variant="amber">Cached Data</Badge>
                  )}
                  {sec.availability === 'ONLINE_ONLY' && (
                    <Badge variant="rose">Online Only</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Local AI Engine & Sync Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg, 24px)' }}>
          
          {/* Local AI / Deterministic Assistant */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="var(--color-accent, #b5541a)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  Local AI Intelligence
                </h2>
              </div>
              <Badge variant={capabilities.isAvailable ? 'emerald' : 'neutral'}>
                {capabilities.fallbackMode === 'deterministic_engine' ? 'Deterministic Engine' : 'Neural Runtime'}
              </Badge>
            </div>

            <div style={{
              background: 'var(--color-warning-soft, #fdf0d8)',
              border: '1px solid rgba(184, 112, 32, 0.25)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '0.78rem',
              color: 'var(--color-warning, #b87020)',
            }}>
              <strong>Zero Cloud Leakage:</strong> {capabilities.disclaimer}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Offline Queries:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {[
                  "What's my plan for today?",
                  "How much is my budget?",
                  "Show my hotel details",
                  "What places did I save?",
                  "What documents do I have?",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      setOfflineQuery(promptText);
                      handleRunOfflineQuery(promptText);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '9999px',
                      background: 'var(--color-surface-muted, #f4f0ea)',
                      border: '1px solid var(--color-border, #e0d5c8)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={offlineQuery}
                onChange={(e) => setOfflineQuery(e.target.value)}
                placeholder="Ask local engine about this trip..."
                onKeyDown={(e) => e.key === 'Enter' && handleRunOfflineQuery()}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px solid var(--color-border, #e0d5c8)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #1c1410)',
                  fontSize: '0.85rem',
                }}
              />
              <Button
                size="sm"
                onClick={() => handleRunOfflineQuery()}
                isLoading={isQuerying}
                rightIcon={<Send size={13} />}
              >
                Ask
              </Button>
            </div>

            {offlineQueryResult && (
              <div style={{
                marginTop: '14px',
                padding: '14px',
                borderRadius: '8px',
                background: 'var(--color-surface-muted, #f4f0ea)',
                border: '1px solid var(--color-border, #e0d5c8)',
                fontSize: '0.83rem',
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap',
                maxHeight: '260px',
                overflowY: 'auto',
                lineHeight: 1.5,
              }}>
                {offlineQueryResult}
              </div>
            )}
          </div>

          {/* Sync Queue Manager */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={18} color="var(--color-accent, #b5541a)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  Sync Queue
                </h2>
              </div>
              <Badge variant={pendingSyncCount > 0 ? 'amber' : 'emerald'}>
                {pendingSyncCount} pending action{pendingSyncCount !== 1 ? 's' : ''}
              </Badge>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              Edits performed while offline are recorded safely and merged with validation upon reconnection.
            </p>

            {/* Test Queue Action creator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={testActionNote}
                onChange={(e) => setTestActionNote(e.target.value)}
                placeholder="Queue an offline itinerary note..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  border: '1px solid var(--color-border, #e0d5c8)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.82rem',
                }}
              />
              <button
                onClick={handleQueueTestAction}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  background: 'var(--color-surface-muted, #f4f0ea)',
                  border: '1px solid var(--color-border, #e0d5c8)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                }}
              >
                + Queue
              </button>
            </div>

            {/* Sync Queue List */}
            {syncQueue.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                ? Sync queue is empty. All trip data is in sync.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {syncQueue.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--color-surface-muted, #f4f0ea)',
                      border: '1px solid var(--color-border, #e0d5c8)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {item.actionType}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {new Date(item.createdAt).toLocaleTimeString()} · retries: {item.retryCount}
                      </div>
                    </div>
                    <Badge variant={item.status === 'synced' ? 'emerald' : item.status === 'pending' ? 'amber' : 'rose'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {syncQueue.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => triggerSync(trip)}
                  isLoading={isSyncing}
                  leftIcon={<RefreshCw size={14} />}
                >
                  Synchronize Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
