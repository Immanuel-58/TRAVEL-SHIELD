'use client';

import React, { useState, useEffect } from 'react';
import { useTrip } from '@/context/TripContext';
import { LocalAIProvider } from '@/services/ai/LocalAIProvider';
import { useOffline } from '@/context/OfflineContext';
import { cameraProvider } from '@/services/device/CameraProvider';
import { voiceProvider } from '@/services/device/VoiceProvider';
import { locationProvider } from '@/services/device/LocationProvider';
import { DISRUPTION_PROVIDER_DISCLAIMER } from '@/services/disruption/DisruptionProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Settings, 
  Cpu, 
  ShieldCheck, 
  Database, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  MapPin,
  Lock,
  Trash2,
  Activity,
  Smartphone,
  Laptop,
  Camera,
  Mic,
  Navigation
} from 'lucide-react';

export default function SettingsPage() {
  const { trips, resetDemoData } = useTrip();
  const { isOffline, syncQueue } = useOffline();
  const [deviceStats, setDeviceStats] = useState({
    camera: 'Detecting...',
    voice: 'Detecting...',
    location: 'Detecting...',
  });

  useEffect(() => {
    async function detect() {
      const cam = await cameraProvider.checkAvailability();
      const voice = await voiceProvider.checkAvailability();
      const loc = await locationProvider.checkAvailability();
      setDeviceStats({
        camera: cam.hasCamera ? 'AVAILABLE (Live Viewfinder & Mobile Capture)' : 'UNAVAILABLE (File Upload Fallback)',
        voice: voice.isAvailable ? 'AVAILABLE (Web Speech API / Android Chrome Engine)' : 'UNAVAILABLE (Browser lacks Web Speech)',
        location: loc.isAvailable ? `AVAILABLE (Status: ${loc.permissionStatus.toUpperCase()})` : 'UNAVAILABLE',
      });
    }
    detect();
  }, []);
  const [resetSuccess, setResetSuccess] = useState(false);

  const localAICapabilities = LocalAIProvider.checkCapabilities();
  const totalDocs = trips.reduce((sum, t) => sum + (t.documents?.length || 0), 0);
  const totalExpenses = trips.reduce((sum, t) => sum + (t.expenses?.length || 0), 0);
  const totalDisruptions = trips.reduce((sum, t) => sum + (t.disruptions?.length || 0), 0);

  const handleResetData = () => {
    if (confirm('Reset all demo trips, expenses, documents, and disruptions back to seed baseline?')) {
      resetDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleClearAllChats = () => {
    if (confirm('Clear local chat history for all trips?')) {
      trips.forEach(t => {
        try {
          localStorage.removeItem(`travelshield_chat_${t.id}`);
        } catch {
          // ignore
        }
      });
      alert('Local chat histories cleared.');
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'var(--color-surface-muted, #f4f0ea)',
          border: '1px solid var(--color-border, #e0d5c8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Settings size={22} color="var(--color-accent, #b5541a)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.7rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, margin: 0 }}>
            System Diagnostics & Settings
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #6b5c4e)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Provider status, local security protocols, offline cache telemetry, and workspace controls.
          </p>
        </div>
      </div>

      {resetSuccess && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          background: 'var(--color-success-soft, #d8f3dc)',
          border: '1px solid var(--color-success, #2d6a4f)',
          color: 'var(--color-success, #2d6a4f)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={18} />
          <span>Demo seed data successfully restored to baseline state.</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Section 1: AI Provider Architecture */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--color-accent, #b5541a)" />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, margin: 0 }}>
                AI Model Architecture
              </h3>
            </div>
            <Badge variant="cyan">Multi-Tier</Badge>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)' }}>Cloud AI Provider</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent, #b5541a)' }}>Server-Side Proxy</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #6b5c4e)', margin: 0, lineHeight: 1.5 }}>
              Target model: <strong>GPT-4o-mini</strong>. API keys are strictly server-side encrypted via <code>.env.local</code>. Never exposed to browser bundle.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)' }}>Local / Offline Provider</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: localAICapabilities.isAvailable ? 'var(--color-success, #2d6a4f)' : 'var(--color-warning, #b87020)' }}>
                {localAICapabilities.isAvailable ? 'Chrome Nano Active' : 'Deterministic Fallback'}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #6b5c4e)', margin: 0, lineHeight: 1.5 }}>
              {localAICapabilities.disclaimer}
            </p>
          </div>
        </Card>

        {/* Section 2: Privacy Sentinel & Data Security */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--color-success, #2d6a4f)" />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, margin: 0 }}>
                Privacy Sentinel Security
              </h3>
            </div>
            <Badge variant="emerald">Local-First</Badge>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', marginBottom: '4px' }}>
              Zero-Cloud Document Scanning
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #6b5c4e)', margin: 0, lineHeight: 1.5 }}>
              Passport MRZ, national ID, credit card, and booking reference scans are processed 100% on-device in browser memory. Raw document files are never uploaded to cloud AI.
            </p>
          </div>

          <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary, #1c1410)', marginBottom: '4px' }}>
              Telemetry Honesty Policy
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #6b5c4e)', margin: 0, lineHeight: 1.5 }}>
              {DISRUPTION_PROVIDER_DISCLAIMER}
            </p>
          </div>
        </Card>

        {/* Section 3: Workspace Persistence & Data Counts */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--color-accent, #b5541a)" />
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, margin: 0 }}>
                Storage & Data Objects
              </h3>
            </div>
            <Badge variant="neutral">IndexedDB / Local</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)' }}>{trips.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>Trip Workspaces</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)' }}>{totalExpenses}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>Logged Expenses</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)' }}>{totalDocs}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>Stored Documents</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--color-surface-muted, #f4f0ea)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)' }}>{totalDisruptions}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>Disruptions Tracked</div>
            </div>
          </div>
        </Card>

        {/* Section 4: Workspace Maintenance Controls */}
        <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={18} color="var(--color-accent, #b5541a)" />
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, margin: 0 }}>
              Maintenance & Demo Controls
            </h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #6b5c4e)', margin: 0 }}>
            Reset sample itineraries, multi-currency transactions, HotelGuard photos, and demo disruption scenarios back to fresh benchmark state.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <Button
              variant="outline"
              leftIcon={<RotateCcw size={14} />}
              onClick={handleResetData}
            >
              Reset Demo Trips & Seed Data
            </Button>

            <Button
              variant="secondary"
              leftIcon={<Trash2 size={14} />}
              onClick={handleClearAllChats}
            >
              Clear Local Chat Histories
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
