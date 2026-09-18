'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTrip } from '@/context/TripContext';
import { ShieldCheck, Plus, Menu, X, ChevronDown, Compass, Sparkles, LayoutDashboard, Wallet, FileText, Settings, Luggage } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { trips, activeTrip, setActiveTripId } = useTrip();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);

  const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/trips', label: 'My Trips', icon: <Luggage size={15} /> },
    { href: '/explore', label: 'Explore', icon: <Compass size={15} /> },
    { href: '/assistant', label: 'AI Assistant', icon: <Sparkles size={15} /> },
    { href: '/expenses', label: 'Expenses', icon: <Wallet size={15} /> },
    { href: '/documents', label: 'Documents', icon: <FileText size={15} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  const handleSelectTrip = (id: string) => {
    setActiveTripId(id);
    setTripDropdownOpen(false);
    router.push(`/trips/${id}/overview`);
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(181,84,26,0.3)',
            }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                TravelShield <span style={{ color: 'var(--color-accent)' }}>AI</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Protect · Prove · Adapt
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 11px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.83rem', fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                }}>
                  <span style={{ opacity: 0.7 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Trip Switcher */}
          {trips.length > 0 && (
            <div style={{ position: 'relative' }} className="desktop-only">
              <button onClick={() => setTripDropdownOpen(!tripDropdownOpen)} style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', fontSize: '0.83rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Active:</span>
                <span style={{ fontWeight: 600, maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeTrip ? activeTrip.name : 'Select Trip'}
                </span>
                <ChevronDown size={13} color="var(--color-text-muted)" />
              </button>

              {tripDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, width: '240px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  padding: '8px', zIndex: 200,
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', padding: '5px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    My Trips
                  </div>
                  {trips.map(t => (
                    <button key={t.id} onClick={() => handleSelectTrip(t.id)} style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                      background: activeTrip?.id === t.id ? 'var(--color-accent-soft)' : 'transparent',
                      color: activeTrip?.id === t.id ? 'var(--color-accent)' : 'var(--color-text-primary)',
                      fontSize: '0.84rem', fontWeight: activeTrip?.id === t.id ? 600 : 400,
                      display: 'flex', flexDirection: 'column', cursor: 'pointer', fontFamily: 'var(--font-body)', border: 'none',
                    }}>
                      <span>{t.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t.destination}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '6px 0' }} />
                  <Link href="/trips/new" onClick={() => setTripDropdownOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)', color: 'var(--color-accent)', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    <Plus size={13} /> Create New Trip
                  </Link>
                </div>
              )}
            </div>
          )}

          <Link href="/trips/new">
            <Button size="sm" leftIcon={<Plus size={14} />}>New Trip</Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only"
            aria-label="Toggle Navigation"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-only" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {mainNavItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px',
              borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '0.9rem',
              color: pathname.startsWith(item.href) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: pathname.startsWith(item.href) ? 'var(--color-accent-soft)' : 'transparent',
            }}>
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
