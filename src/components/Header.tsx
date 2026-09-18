'use client';

import React from 'react';
import { useTrip } from '@/context/TripContext';
import { ShieldCheck, Calendar, MapPin, Wifi, Sparkles, AlertTriangle } from 'lucide-react';

export function Header() {
  const { activeTrip } = useTrip();

  if (!activeTrip) return null;

  return (
    <header style={{
      padding: '16px 28px',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Left: Product Identity & Active Trip Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                TravelShield <span style={{ color: 'var(--accent-cyan)' }}>AI</span>
              </span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-active)', fontWeight: 700 }}>
                HACKATHON EDITION
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Protect. Prove. Adapt.
            </div>
          </div>
        </div>

        <div style={{ height: '28px', width: '1px', background: 'var(--border-subtle)' }} />

        {/* Active Trip Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="var(--accent-cyan)" />
              {activeTrip.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />{activeTrip.startDate} → {activeTrip.endDate}</span>
              <span>•</span>
              <span className="badge-trust badge-trust-user_entered">
                USER_ENTERED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Privacy Sentinel Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '0.8rem',
          color: 'var(--accent-emerald)',
          fontWeight: 600
        }}>
          <ShieldCheck size={14} />
          <span>Privacy Sentinel: Active</span>
        </div>

        {/* Network & Local Engine Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <Wifi size={14} color="var(--accent-cyan)" />
          <span>Local Engine Standby</span>
        </div>
      </div>
    </header>
  );
}
