'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Sparkles, Compass, MapPin,
  Map as MapIcon, Wallet, Receipt, FileLock2, Camera, WifiOff, AlertTriangle
} from 'lucide-react';
import { useOffline } from '@/context/OfflineContext';
import { useTrip } from '@/context/TripContext';

export interface TripWorkspaceNavProps {
  tripId: string;
}

export function TripWorkspaceNav({ tripId }: TripWorkspaceNavProps) {
  const pathname = usePathname();
  const { isOffline, activePack } = useOffline();
  const { trips } = useTrip();

  const currentTrip = trips.find((t) => t.id === tripId);
  const activeDisruptionsCount = (currentTrip?.disruptions || []).filter((d) => d.status === 'active').length;

  const sections = [
    { id: 'overview',    label: 'Overview',     href: `/trips/${tripId}/overview`,    icon: <LayoutDashboard size={15} /> },
    { id: 'assistant',   label: 'AI Assistant', href: `/trips/${tripId}/assistant`,   icon: <Sparkles size={15} /> },
    { id: 'plan',        label: 'Plan',         href: `/trips/${tripId}/plan`,        icon: <Compass size={15} /> },
    { id: 'explore',     label: 'Explore',      href: `/trips/${tripId}/explore`,     icon: <MapPin size={15} /> },
    { id: 'map',         label: 'Map',          href: `/trips/${tripId}/map`,         icon: <MapIcon size={15} /> },
    { id: 'budget',      label: 'Budget',       href: `/trips/${tripId}/budget`,      icon: <Wallet size={15} /> },
    { id: 'expenses',    label: 'Expenses',     href: `/trips/${tripId}/expenses`,    icon: <Receipt size={15} /> },
    { id: 'disruptions', label: 'Disruptions',  href: `/trips/${tripId}/disruptions`, icon: <AlertTriangle size={15} /> },
    { id: 'documents',   label: 'Documents',    href: `/trips/${tripId}/documents`,   icon: <FileLock2 size={15} /> },
    { id: 'hotelguard',  label: 'HotelGuard',   href: `/trips/${tripId}/hotelguard`,  icon: <Camera size={15} /> },
    { id: 'offline',     label: 'Offline',      href: `/trips/${tripId}/offline`,     icon: <WifiOff size={15} /> },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      background: 'var(--color-surface)',
      padding: '6px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      overflowX: 'auto',
      marginBottom: '20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {sections.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.83rem',
              fontWeight: isActive ? 700 : 400,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-accent-soft)' : 'transparent',
              border: isActive ? '1px solid rgba(181,84,26,0.2)' : '1px solid transparent',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'disruptions' && activeDisruptionsCount > 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#fdf0d8', color: '#b87020', border: '1px solid #f6d899' }}>
                {activeDisruptionsCount}
              </span>
            )}
            {item.id === 'offline' && activePack && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success, #2d6a4f)' }} title="Offline Pack Downloaded" />
            )}
            {item.id === 'offline' && isOffline && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'var(--color-warning-soft, #fdf0d8)', color: 'var(--color-warning, #b87020)' }}>
                Offline
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
