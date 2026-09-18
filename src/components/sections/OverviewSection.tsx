'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { useOffline } from '@/context/OfflineContext';
import { locationProvider, LocationCoordinates } from '@/services/device/LocationProvider';
import { 
  Calendar, Wallet, FileCheck2, Camera, Sparkles, MapPin, 
  Lock, Shield, CheckCircle2, AlertTriangle, Wifi, WifiOff,
  Navigation as NavIcon, RefreshCw, Compass, Receipt, ArrowRight,
  ShieldAlert, Sparkle
} from 'lucide-react';

export function OverviewSection() {
  const { activeTrip } = useTrip();
  const { isOffline, isSyncing, syncQueue } = useOffline();
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);
  const [todayDateFormatted, setTodayDateFormatted] = useState('Today');

  useEffect(() => {
    setTodayDateFormatted(new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }));
  }, []);

  if (!activeTrip) return null;

  const totalSpent = (activeTrip.expenses || []).reduce((s, e) => s + (e.baseAmount || 0), 0) || (activeTrip.expensesSummary?.totalSpent || 0);
  const totalBudget = activeTrip.budget || 0;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const budgetPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  // Next scheduled activity
  const allItems = (activeTrip.itineraryDays || []).flatMap(d => (d.items || []).map(item => ({ ...item, dayNumber: d.dayNumber })));
  const nextItem = allItems[0];

  const activeDisruptions = (activeTrip.disruptions || []).filter(d => d.status === 'active');

  const handleLocateMe = async () => {
    setLocationLoading(true);
    setLocationMsg(null);
    try {
      const loc = await locationProvider.getCurrentLocation();
      setUserLocation(loc);
      setLocationMsg(`GPS Accuracy: ±${Math.round(loc.accuracyMeters)}m`);
    } catch (err: any) {
      setLocationMsg(err.message || 'Location unavailable');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Warm Editorial Hero Banner */}
      <div style={{
        padding: '28px',
        borderRadius: 'var(--radius-lg, 16px)',
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e0d5c8)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-trust badge-trust-user_entered">
              AUTHENTIC TRIP CONTEXT
            </span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
              • Active Workspace
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOffline ? (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: 'var(--color-warning-soft, #fdf0d8)', color: 'var(--color-warning, #b87020)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WifiOff size={12} /> OFFLINE MODE
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: 'var(--color-success-soft, #d8f0e6)', color: 'var(--color-success, #2d6a4f)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={12} /> CLOUD CONNECTED
              </span>
            )}
            {syncQueue.length > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: 'var(--color-info-soft, #ddeeff)', color: 'var(--color-info, #1a6fb5)' }}>
                {syncQueue.length} queued mutations
              </span>
            )}
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-text-primary, #1c1410)', margin: '0 0 6px 0', fontFamily: 'var(--font-display)' }}>
            {activeTrip.name}
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #6b5c4e)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={15} color="var(--color-accent, #b5541a)" />
              {activeTrip.destination}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={15} color="var(--color-text-muted)" />
              {activeTrip.startDate} to {activeTrip.endDate}
            </span>
          </p>
        </div>

        {/* Core Pillars: PLAN -> PROTECT -> PROVE -> ADAPT */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          marginTop: '10px',
          paddingTop: '12px',
          borderTop: '1px solid var(--color-border, #e0d5c8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
            <Sparkles size={14} color="var(--color-accent, #b5541a)" />
            <span><strong>PLAN:</strong> AI & Budget</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
            <Shield size={14} color="var(--color-success, #2d6a4f)" />
            <span><strong>PROTECT:</strong> PII Vault</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
            <Camera size={14} color="var(--color-warning, #b87020)" />
            <span><strong>PROVE:</strong> HotelGuard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>
            <RefreshCw size={14} color="#1a6fb5" />
            <span><strong>ADAPT:</strong> Replanning</span>
          </div>
        </div>
      </div>

      {/* 2. "TravelShield Today" Mobile Command Card */}
      <div style={{
        background: 'var(--color-surface-muted, #f4f0ea)',
        border: '1px solid var(--color-border, #e0d5c8)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-accent, #b5541a)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TravelShield Today
            </div>
            <h3 style={{ fontSize: '1.2rem', margin: '2px 0 0 0', color: 'var(--color-text-primary, #1c1410)' }}>
              {todayDateFormatted}
            </h3>
          </div>
          <button
            onClick={handleLocateMe}
            disabled={locationLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e0d5c8)',
              color: 'var(--color-text-primary, #1c1410)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <NavIcon size={13} color="var(--color-accent, #b5541a)" />
            <span>{locationLoading ? 'Locating...' : 'Locate Me'}</span>
          </button>
        </div>

        {locationMsg && (
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            {locationMsg}
          </div>
        )}

        {/* Today's key metrics row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {/* Next Activity */}
          <div style={{ background: 'var(--color-surface, #ffffff)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Next Itinerary Spot
            </div>
            {nextItem ? (
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)' }}>
                  {nextItem.activity}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                  Day {nextItem.dayNumber} • {nextItem.startTime || '10:00 AM'} ({nextItem.location})
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                No scheduled activities today
              </div>
            )}
          </div>

          {/* Budget Pacing */}
          <div style={{ background: 'var(--color-surface, #ffffff)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Budget Remaining
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)' }}>
              ${remainingBudget.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ ${totalBudget.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: totalSpent > totalBudget ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {budgetPercentage}% total budget utilized
            </div>
          </div>

          {/* Disruption Alert */}
          <div style={{ background: 'var(--color-surface, #ffffff)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border, #e0d5c8)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              Schedule Status
            </div>
            {activeDisruptions.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning, #b87020)' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  {activeDisruptions.length} Active Disruption{activeDisruptions.length > 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success, #2d6a4f)' }}>
                <CheckCircle2 size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Schedule On Track</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Eight One-Tap Mobile Quick Actions */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
          One-Tap Mobile Actions
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px',
        }}>
          {/* Action 1: AI Plan */}
          <Link
            href={`/trips/${activeTrip.id}/assistant`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <Sparkles size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>AI PLAN</span>
          </Link>

          {/* Action 2: Add Expense */}
          <Link
            href={`/trips/${activeTrip.id}/expenses`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <Wallet size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>ADD EXPENSE</span>
          </Link>

          {/* Action 3: Scan Document */}
          <Link
            href={`/trips/${activeTrip.id}/documents`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
              <FileCheck2 size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>SCAN DOC</span>
          </Link>

          {/* Action 4: Scan Receipt */}
          <Link
            href={`/trips/${activeTrip.id}/expenses`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-info-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-info)' }}>
              <Receipt size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>SCAN RECEIPT</span>
          </Link>

          {/* Action 5: HotelGuard */}
          <Link
            href={`/trips/${activeTrip.id}/hotelguard`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
              <Camera size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>HOTELGUARD</span>
          </Link>

          {/* Action 6: Replan */}
          <Link
            href={`/trips/${activeTrip.id}/disruptions`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
              <RefreshCw size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>REPLAN</span>
          </Link>

          {/* Action 7: Offline Mode */}
          <Link
            href={`/trips/${activeTrip.id}/offline`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-surface-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
              <WifiOff size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>OFFLINE MODE</span>
          </Link>

          {/* Action 8: Map */}
          <Link
            href={`/trips/${activeTrip.id}/map`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '14px 10px', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textAlign: 'center', textDecoration: 'none', boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
              <Compass size={18} />
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>MAP</span>
          </Link>
        </div>
      </div>

      {/* 4. Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
        {/* Budget Metric */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Total Spent / Budget</span>
            <Wallet size={18} color="var(--color-accent, #b5541a)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)', fontFamily: 'var(--font-display)' }}>
            ${totalSpent.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'var(--font-body)' }}>/ ${totalBudget.toLocaleString()}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--color-border, #e0d5c8)', borderRadius: '4px', margin: '12px 0 8px 0', overflow: 'hidden' }}>
            <div style={{ width: `${budgetPercentage}%`, height: '100%', background: budgetPercentage > 90 ? 'var(--color-danger, #a82020)' : 'var(--color-accent, #b5541a)' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{budgetPercentage}% used</span>
            <span>${remainingBudget.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Itinerary Count */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Scheduled Activities</span>
            <Calendar size={18} color="var(--color-success, #2d6a4f)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)', fontFamily: 'var(--font-display)' }}>
            {(activeTrip.itineraryDays || []).reduce((s, d) => s + (d.items?.length || 0), 0) || activeTrip.itinerarySummary?.totalItems || 0} Items
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Across {activeTrip.itineraryDays?.length || activeTrip.itinerarySummary?.daysCount || 0} days planned
          </p>
        </div>

        {/* HotelGuard Evidence */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>HotelGuard Evidence</span>
            <Camera size={18} color="var(--color-warning, #b87020)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)', fontFamily: 'var(--font-display)' }}>
            {activeTrip.hotelGuardSessions?.length || activeTrip.hotelGuardSummary?.totalInspections || 0} Inspections
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success, #2d6a4f)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} /> Local Hashed Evidence Logged
          </div>
        </div>

        {/* Privacy Sentinel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Secured Documents</span>
            <FileCheck2 size={18} color="#1a6fb5" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary, #1c1410)', fontFamily: 'var(--font-display)' }}>
            {activeTrip.documents?.length || activeTrip.documentsSummary?.totalDocs || 0} Files
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-success, #2d6a4f)', marginTop: '8px' }}>
            PII Shield Active
          </p>
        </div>
      </div>
    </div>
  );
}
