'use client';

import React, { useState, useMemo } from 'react';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Disruption, 
  DisruptionType, 
  DisruptionSeverity, 
  ReplanOption, 
  ReplanHistoryEntry 
} from '@/types/disruption';
import { disruptionProvider, DISRUPTION_PROVIDER_DISCLAIMER } from '@/services/disruption/DisruptionProvider';
import { ReplanEngine } from '@/services/disruption/ReplanEngine';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  Plane, 
  CloudRain, 
  Building2, 
  Train, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Check, 
  X, 
  Plus, 
  ShieldAlert, 
  History, 
  Compass, 
  DollarSign, 
  Sliders, 
  Info,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface DisruptionsSectionProps {
  tripId: string;
}

const TYPE_ICONS: Record<DisruptionType, React.ReactNode> = {
  FLIGHT_DELAY: <Plane size={18} />,
  FLIGHT_CANCELLED: <Plane size={18} />,
  TRAIN_DELAY: <Train size={18} />,
  TRANSPORT_DELAY: <Train size={18} />,
  WEATHER: <CloudRain size={18} />,
  VENUE_CLOSED: <Building2 size={18} />,
  ACTIVITY_UNAVAILABLE: <Building2 size={18} />,
  MISSED_CONNECTION: <Clock size={18} />,
  USER_CHANGE: <Sliders size={18} />,
  TIME_CONSTRAINT: <Clock size={18} />,
  BUDGET_CHANGE: <DollarSign size={18} />,
  OTHER: <HelpCircle size={18} />,
};

const SEVERITY_COLORS: Record<DisruptionSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: '#fee2e2', text: '#b91c1c', border: '#f87171' },
  high: { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' },
  medium: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  low: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
};

export function DisruptionsSection({ tripId }: DisruptionsSectionProps) {
  const { trips, activeTrip, reportDisruption, resolveDisruption, dismissDisruption, applyReplanOption } = useTrip();
  const currentTrip = trips.find(t => t.id === tripId) || activeTrip;

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [selectedDisruption, setSelectedDisruption] = useState<Disruption | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [replanSuccessMessage, setReplanSuccessMessage] = useState<string | null>(null);

  // Manual Report Form states
  const [reportInput, setReportInput] = useState('');
  const [reportType, setReportType] = useState<DisruptionType>('FLIGHT_DELAY');
  const [reportSeverity, setReportSeverity] = useState<DisruptionSeverity>('high');
  const [reportDate, setReportDate] = useState(currentTrip?.startDate || new Date().toISOString().split('T')[0]);

  const disruptions = useMemo(() => currentTrip?.disruptions || [], [currentTrip?.disruptions]);
  const replanHistory = useMemo(() => currentTrip?.replanHistory || [], [currentTrip?.replanHistory]);

  const activeDisruptions = useMemo(
    () => disruptions.filter(d => d.status === 'active' || d.status === 'reviewing'),
    [disruptions]
  );
  const resolvedDisruptions = useMemo(
    () => disruptions.filter(d => d.status === 'resolved' || d.status === 'dismissed'),
    [disruptions]
  );

  // Auto-generate replan options for selected disruption
  const activeOptions = useMemo(() => {
    if (!currentTrip || !selectedDisruption) return [];
    return ReplanEngine.generateReplanOptions(currentTrip, selectedDisruption);
  }, [currentTrip, selectedDisruption]);

  const handleOpenReplan = (disruption: Disruption) => {
    setSelectedDisruption(disruption);
    const options = currentTrip ? ReplanEngine.generateReplanOptions(currentTrip, disruption) : [];
    setSelectedOptionId(options[0]?.id || null);
    setIsReplanModalOpen(true);
    setReplanSuccessMessage(null);
  };

  const handleApplySelectedOption = () => {
    if (!currentTrip || !selectedDisruption || !selectedOptionId) return;
    const option = activeOptions.find(o => o.id === selectedOptionId);
    if (!option) return;

    applyReplanOption(tripId, option);
    setReplanSuccessMessage(`Successfully applied "${option.title}". Your itinerary and schedule have been updated.`);

    setTimeout(() => {
      setIsReplanModalOpen(false);
      setSelectedDisruption(null);
      setReplanSuccessMessage(null);
    }, 1800);
  };

  const handleTriggerPreset = (scenario: 'flight_delay_3h' | 'heavy_rain' | 'venue_closure' | 'missed_train') => {
    if (!currentTrip) return;
    const demo = disruptionProvider.createDemoDisruption(scenario, currentTrip);
    reportDisruption(tripId, demo);
    setIsReportModalOpen(false);
  };

  const handleCustomReport = () => {
    if (!currentTrip || !reportInput.trim()) return;
    const parsed = disruptionProvider.parseUserDisruptionReport(reportInput, currentTrip);
    parsed.type = reportType;
    parsed.severity = reportSeverity;
    parsed.affectedDate = reportDate;

    reportDisruption(tripId, parsed);
    setReportInput('');
    setIsReportModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Disruption Center & Dynamic Replanning
            </h1>
            {activeDisruptions.length > 0 && (
              <Badge variant="accent" style={{ backgroundColor: 'var(--accent-crimson, #ef4444)', color: '#ffffff', fontSize: '0.75rem' }}>
                {activeDisruptions.length} Active {activeDisruptions.length === 1 ? 'Alert' : 'Alerts'}
              </Badge>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginTop: '6px', margin: 0 }}>
            Detect travel delays, assess schedule blast radius, review safe AI alternatives, and adapt your trip plan seamlessly.
          </p>
        </div>

        <Button 
          variant="primary" 
          onClick={() => setIsReportModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-terracotta)' }}
        >
          <Plus size={18} />
          <span>Report / Simulate Disruption</span>
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Active Disruptions */}
        <Card style={{ padding: '20px', borderLeft: `4px solid ${activeDisruptions.length > 0 ? 'var(--accent-crimson, #ef4444)' : 'var(--accent-emerald, #10b981)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active Disruptions
            </span>
            <AlertTriangle size={20} color={activeDisruptions.length > 0 ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {activeDisruptions.length}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {activeDisruptions.length === 0 ? 'All schedules operating normally' : 'Require schedule review & replan'}
          </div>
        </Card>

        {/* Resolved Disruptions */}
        <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald, #10b981)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Resolved Events
            </span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {resolvedDisruptions.length}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Addressed through replanning or clearance
          </div>
        </Card>

        {/* Applied Replans */}
        <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan, #0ea5e9)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Replan Adaptations
            </span>
            <Compass size={20} color="#0ea5e9" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {replanHistory.length}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Approved schedule evolutions recorded
          </div>
        </Card>

        {/* Telemetry Status */}
        <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber, #f59e0b)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Telemetry Mode
            </span>
            <Info size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Local / Simulation
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Trust: ESTIMATED / USER_ENTERED
          </div>
        </Card>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'active' ? 'var(--color-surface-muted, #f4f0ea)' : 'transparent',
            color: activeTab === 'active' ? 'var(--accent-terracotta)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'active' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} />
          <span>Active Disruptions ({activeDisruptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'history' ? 'var(--color-surface-muted, #f4f0ea)' : 'transparent',
            color: activeTab === 'history' ? 'var(--accent-terracotta)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'history' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <History size={16} />
          <span>Replan History ({replanHistory.length})</span>
        </button>
      </div>

      {/* Tab 1: Active Disruptions */}
      {activeTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeDisruptions.length === 0 ? (
            <Card style={{ padding: '48px 24px' }}>
              <EmptyState 
                icon={<CheckCircle2 size={36} color="var(--accent-emerald, #10b981)" />}
                title="No Active Disruptions Detected"
                description="Your travel itinerary is on schedule with no reported delays, adverse weather warnings, or venue closures."
                actionLabel="Simulate Disruption Scenario"
                onAction={() => setIsReportModalOpen(true)}
              />
            </Card>
          ) : (
            activeDisruptions.map(disruption => {
              const impact = currentTrip ? ReplanEngine.analyzeImpact(currentTrip, disruption) : null;
              const sev = SEVERITY_COLORS[disruption.severity];

              return (
                <Card key={disruption.id} style={{ padding: '24px', borderLeft: `5px solid ${sev.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    {/* Header & Details */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 340px' }}>
                      <div style={{ 
                        backgroundColor: sev.bg, 
                        color: sev.text, 
                        padding: '12px', 
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {TYPE_ICONS[disruption.type] || <AlertTriangle size={20} />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                            {disruption.title}
                          </h3>
                          <Badge variant="neutral" style={{ backgroundColor: sev.bg, color: sev.text, border: `1px solid ${sev.border}`, fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                            {disruption.severity} Severity
                          </Badge>
                          <Badge variant="neutral" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                            Source: {disruption.source.replace('_', ' ')}
                          </Badge>
                        </div>

                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: '2px 0 0 0' }}>
                          {disruption.description}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} />
                            Affected Date: {disruption.affectedDate || 'Today'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} />
                            Logged: {new Date(disruption.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Button 
                        variant="primary" 
                        onClick={() => handleOpenReplan(disruption)}
                        style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Sparkles size={16} />
                        <span>Review Replan Options</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => resolveDisruption(tripId, disruption.id)}
                        style={{ color: 'var(--color-text-secondary)' }}
                        title="Mark as cleared"
                      >
                        <Check size={14} style={{ marginRight: '4px' }} />
                        Clear
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => dismissDisruption(tripId, disruption.id)}
                        style={{ color: 'var(--color-text-muted)' }}
                        title="Dismiss alert"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Impact Blast Radius Callout */}
                  {impact && impact.cascadeRisks.length > 0 && (
                    <div style={{ marginTop: '16px', backgroundColor: 'var(--color-surface-muted, #f4f0ea)', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sliders size={14} color="var(--accent-terracotta)" />
                        <span>Impact Analysis & Cascade Risks:</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {impact.cascadeRisks.map((risk, rIdx) => (
                          <div key={rIdx} style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-terracotta)' }} />
                            <span>{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Replan History */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {replanHistory.length === 0 ? (
            <Card style={{ padding: '40px' }}>
              <EmptyState 
                icon={<History size={36} color="var(--accent-cyan)" />}
                title="No Replan History Yet"
                description="When you approve and apply an AI replan proposal during a disruption, the evolution of your itinerary will be permanently recorded here."
              />
            </Card>
          ) : (
            replanHistory.map(entry => (
              <Card key={entry.id} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        {entry.optionTitle}
                      </h4>
                      <Badge variant="neutral" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.72rem' }}>
                        Applied
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      Trigger: <strong>{entry.disruptionTitle}</strong>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {entry.summary}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {entry.costImpactSummary}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {new Date(entry.approvedAt).toLocaleDateString()} at {new Date(entry.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {entry.changesSnapshot && entry.changesSnapshot.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {entry.changesSnapshot.map((ch, cIdx) => (
                      <span key={cIdx} style={{ fontSize: '0.76rem', backgroundColor: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-secondary)' }}>
                        <strong>{ch.type.toUpperCase()}:</strong> {ch.activityName} {ch.newTime ? `(${ch.newTime})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal 1: Report / Simulate Disruption */}
      <Modal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)}
        title="Report Travel Disruption or Run Simulation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick simulation presets */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              ⚡ Quick Simulation Scenarios (Demo Benchmark)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleTriggerPreset('flight_delay_3h')}
                style={{ textAlign: 'left', padding: '10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plane size={16} color="var(--accent-terracotta)" />
                <span>3-Hour Flight Delay</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleTriggerPreset('heavy_rain')}
                style={{ textAlign: 'left', padding: '10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <CloudRain size={16} color="#0ea5e9" />
                <span>Heavy Rain Tomorrow</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleTriggerPreset('venue_closure')}
                style={{ textAlign: 'left', padding: '10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Building2 size={16} color="#b45309" />
                <span>Louvre Closure</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleTriggerPreset('missed_train')}
                style={{ textAlign: 'left', padding: '10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Train size={16} color="#8b5cf6" />
                <span>Missed Train Connection</span>
              </Button>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />

          {/* Custom Traveler Report Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              ✍ Report Actual On-Ground Disruption
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Disruption Description *
              </label>
              <textarea 
                rows={3}
                placeholder="e.g., 'My flight has been delayed by 2 hours' or 'Heavy rain is expected all afternoon'..."
                value={reportInput}
                onChange={e => setReportInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Disruption Category
                </label>
                <select 
                  value={reportType}
                  onChange={e => setReportType(e.target.value as DisruptionType)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="FLIGHT_DELAY">Flight Delay</option>
                  <option value="FLIGHT_CANCELLED">Flight Cancelled</option>
                  <option value="TRAIN_DELAY">Train Delay</option>
                  <option value="WEATHER">Adverse Weather</option>
                  <option value="VENUE_CLOSED">Venue Closure</option>
                  <option value="MISSED_CONNECTION">Missed Connection</option>
                  <option value="TIME_CONSTRAINT">Time Constraint</option>
                  <option value="USER_CHANGE">Traveler Preference</option>
                  <option value="OTHER">Other Disruption</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Severity Level
                </label>
                <select 
                  value={reportSeverity}
                  onChange={e => setReportSeverity(e.target.value as DisruptionSeverity)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="critical">Critical (Trip-stopping)</option>
                  <option value="high">High (Major activities affected)</option>
                  <option value="medium">Medium (Schedule overlap / delay)</option>
                  <option value="low">Low (Minor adjustment)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Affected Date
              </label>
              <input 
                type="date"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            {DISRUPTION_PROVIDER_DISCLAIMER}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="ghost" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCustomReport}
              disabled={!reportInput.trim()}
              style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff' }}
            >
              Submit Report & Replan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Review Replan Proposals */}
      <Modal 
        isOpen={isReplanModalOpen} 
        onClose={() => setIsReplanModalOpen(false)}
        title="Dynamic AI Replan Proposals"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
          {selectedDisruption && (
            <div style={{ backgroundColor: 'var(--color-surface-muted, #f4f0ea)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Responding to Disruption:
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                {selectedDisruption.title}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {selectedDisruption.description}
              </div>
            </div>
          )}

          {replanSuccessMessage && (
            <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>{replanSuccessMessage}</span>
            </div>
          )}

          {/* Replan Alternative Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeOptions.map(option => {
              const isSelected = selectedOptionId === option.id;

              return (
                <div 
                  key={option.id}
                  onClick={() => setSelectedOptionId(option.id)}
                  style={{
                    padding: '18px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--accent-terracotta)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? '#fffdf7' : 'var(--color-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(181, 84, 26, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="radio" 
                        name="replanOption" 
                        checked={isSelected} 
                        onChange={() => setSelectedOptionId(option.id)} 
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-text-primary)' }}>
                        {option.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant="neutral" style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        Feasibility: {option.feasibilityScore}%
                      </Badge>
                      <Badge variant="neutral" style={{ fontSize: '0.72rem', backgroundColor: option.costImpact.amount > 0 ? '#fef3c7' : '#dcfce7', color: option.costImpact.amount > 0 ? '#b45309' : '#15803d' }}>
                        {option.costImpact.amount > 0 ? `+${option.costImpact.currency} ${option.costImpact.amount}` : 'Budget Neutral'}
                      </Badge>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    {option.description}
                  </p>

                  {/* Concrete schedule modifications */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '6px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Proposed Schedule Modifications:
                    </div>
                    {option.changes.map((ch, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <ArrowRight size={13} color="var(--accent-terracotta)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>
                          <strong>{ch.activityName}</strong>: {ch.reason}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tradeoffs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {option.tradeoffs.map((to, tIdx) => (
                      <div key={tIdx} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        • {to}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setIsReplanModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApplySelectedOption}
              disabled={!selectedOptionId}
              style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} />
              <span>Approve & Apply Replan</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
