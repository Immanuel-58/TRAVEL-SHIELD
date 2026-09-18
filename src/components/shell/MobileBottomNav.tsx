'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Compass, Sparkles, Receipt, MoreHorizontal,
  Map as MapIcon, Camera, FileLock2, AlertTriangle, WifiOff, Settings, Laptop, X
} from 'lucide-react';
import { useTrip } from '@/context/TripContext';
import { OfficeKitSyncModal } from '@/components/ui/OfficeKitSyncModal';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { activeTrip } = useTrip();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [officeKitOpen, setOfficeKitOpen] = useState(false);

  const tripId = activeTrip?.id || 'paris-expedition-2026';

  const primaryTabs = [
    { label: 'Today', href: `/trips/${tripId}/overview`, icon: <LayoutDashboard size={20} /> },
    { label: 'Plan', href: `/trips/${tripId}/plan`, icon: <Compass size={20} /> },
    { label: 'Assistant', href: `/trips/${tripId}/assistant`, icon: <Sparkles size={20} />, highlight: true },
    { label: 'Expenses', href: `/trips/${tripId}/expenses`, icon: <Receipt size={20} /> },
  ];

  const moreItems = [
    { label: 'Map & Route', href: `/trips/${tripId}/map`, icon: <MapIcon size={18} /> },
    { label: 'Disruptions', href: `/trips/${tripId}/disruptions`, icon: <AlertTriangle size={18} /> },
    { label: 'HotelGuard Evidence', href: `/trips/${tripId}/hotelguard`, icon: <Camera size={18} /> },
    { label: 'Document Vault', href: `/trips/${tripId}/documents`, icon: <FileLock2 size={18} /> },
    { label: 'Explore & Places', href: `/trips/${tripId}/explore`, icon: <Compass size={18} /> },
    { label: 'Offline Vault', href: `/trips/${tripId}/offline`, icon: <WifiOff size={18} /> },
    { label: 'System Settings', href: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Fixed Bottom Bar */}
      <nav
        className="mobile-only"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--color-surface, #ffffff)',
          borderTop: '1px solid var(--color-border, #e0d5c8)',
          boxShadow: '0 -2px 10px rgba(28, 20, 16, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 900,
        }}
      >
        {primaryTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                height: '100%',
                color: isActive ? 'var(--color-accent, #b5541a)' : 'var(--color-text-secondary, #6b5c4e)',
                textDecoration: 'none',
                minWidth: '48px',
              }}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: tab.highlight ? '34px' : 'auto',
                height: tab.highlight ? '34px' : 'auto',
                borderRadius: tab.highlight ? '50%' : '0',
                background: tab.highlight ? (isActive ? 'var(--color-accent)' : 'var(--color-accent-soft)') : 'transparent',
                color: tab.highlight && isActive ? '#ffffff' : undefined,
              }}>
                {tab.icon}
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            height: '100%',
            color: drawerOpen ? 'var(--color-accent, #b5541a)' : 'var(--color-text-secondary, #6b5c4e)',
            cursor: 'pointer',
            minWidth: '48px',
          }}
        >
          <MoreHorizontal size={20} />
          <span style={{ fontSize: '0.68rem', fontWeight: drawerOpen ? 700 : 500 }}>
            More
          </span>
        </button>
      </nav>

      {/* Slide-up Sheet / Drawer */}
      {drawerOpen && (
        <div
          className="mobile-only"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 'calc(62px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(28, 20, 16, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 899,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            style={{
              background: 'var(--color-surface, #ffffff)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary, #1c1410)' }}>
                  Trip Workspace Modules
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  Active: {activeTrip?.name || 'Paris Expedition'}
                </span>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ padding: '6px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Office Kit Action Banner */}
            <div style={{
              background: 'var(--color-accent-soft, #f2e6db)',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(181,84,26,0.2)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Laptop size={18} color="var(--color-accent, #b5541a)" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-accent, #b5541a)' }}>
                    Office Kit Bridge
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary, #6b5c4e)' }}>
                    Sync Phone ↔ Laptop via Shared Clipboard
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setDrawerOpen(false); setOfficeKitOpen(true); }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'var(--color-accent, #b5541a)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sync
              </button>
            </div>

            {/* List of Other Modules */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {moreItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--color-surface-muted, #f4f0ea)',
                    border: '1px solid var(--color-border, #e0d5c8)',
                    color: 'var(--color-text-primary, #1c1410)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ color: 'var(--color-accent, #b5541a)' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Office Kit Modal */}
      <OfficeKitSyncModal isOpen={officeKitOpen} onClose={() => setOfficeKitOpen(false)} />
    </>
  );
}
