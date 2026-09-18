'use client';

import React from 'react';
import { useTrip } from '@/context/TripContext';
import { 
  Compass, 
  Plane, 
  Hotel, 
  MapPin, 
  Map as MapIcon, 
  WifiOff, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface GenericSectionProps {
  sectionId: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export function GenericSection({ sectionId, title, subtitle, icon }: GenericSectionProps) {
  const { activeTrip } = useTrip();

  if (!activeTrip) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon}
            {title}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        </div>

        <span className={`badge-trust badge-trust-${sectionId === 'offline' ? 'offline' : 'estimated'}`}>
          {sectionId === 'offline' ? 'OFFLINE READ-ONLY' : 'ESTIMATED / RESEARCH MODE'}
        </span>
      </div>

      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--border-active)' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.3rem' }}>{title} Subsystem Scaffold</h3>
        <p style={{ maxWidth: '520px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Connected to Central Trip: <strong>{activeTrip.name}</strong> ({activeTrip.destination}).
          This section is fully scaffolded into the Trip Workspace shell and ready for phase-specific engine implementation.
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
            Data Trust Rule: No Invented Live APIs
          </span>
          <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
            State Scope: Active Trip Object
          </span>
        </div>
      </div>
    </div>
  );
}
