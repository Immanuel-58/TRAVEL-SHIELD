'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrip } from '@/context/TripContext';
import { 
  LayoutDashboard, 
  Sparkles, 
  Compass, 
  MapPin, 
  Wallet, 
  Map as MapIcon, 
  FileLock2, 
  Camera, 
  WifiOff 
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { activeTrip } = useTrip();

  const tripId = activeTrip?.id || 'paris-expedition-2026';

  const navItems = [
    { label: 'Trip Overview', href: `/trips/${tripId}/overview`, icon: <LayoutDashboard size={18} /> },
    { label: 'AI Assistant', href: `/trips/${tripId}/assistant`, icon: <Sparkles size={18} />, badge: 'AI' },
    { label: 'Trip Planning', href: `/trips/${tripId}/plan`, icon: <Compass size={18} /> },
    { label: 'Places & Activities', href: `/trips/${tripId}/explore`, icon: <MapPin size={18} /> },
    { label: 'Budget & Expenses', href: `/trips/${tripId}/budget`, icon: <Wallet size={18} /> },
    { label: 'Interactive Map', href: `/trips/${tripId}/map`, icon: <MapIcon size={18} /> },
    { label: 'Privacy Sentinel & Docs', href: `/trips/${tripId}/documents`, icon: <FileLock2 size={18} />, badge: 'Shield' },
    { label: 'HotelGuard Evidence', href: `/trips/${tripId}/hotelguard`, icon: <Camera size={18} />, badge: 'Prove' },
    { label: 'Offline Vault', href: `/trips/${tripId}/offline`, icon: <WifiOff size={18} /> },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(12, 16, 26, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      minHeight: 'calc(100vh - 71px)',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 12px 10px 12px', textTransform: 'uppercase' }}>
        Trip Workspace Navigation
      </div>

      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: isActive ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'transparent',
              border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.88rem',
              transition: 'all var(--transition-fast)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                background: item.badge === 'AI' ? 'rgba(6, 182, 212, 0.2)' : item.badge === 'Prove' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: item.badge === 'AI' ? 'var(--accent-cyan)' : item.badge === 'Prove' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </aside>
  );
}

