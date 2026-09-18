'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTrip } from '@/context/TripContext';
import {
  HotelGuardSession, HotelEvidence, HotelGuardSessionStatus, HotelComparison
} from '@/types/travel';
import {
  generateEvidenceStorageKey,
  metadataComparisonProvider,
  generateHotelGuardReport,
  HOTELGUARD_DISCLAIMER,
} from '@/services/hotelguard/HotelGuardService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CameraCaptureModal } from '@/components/ui/CameraCaptureModal';
import { CameraSnapshotResult } from '@/services/device/CameraProvider';
import {
  Camera, Shield, ShieldCheck, ShieldAlert, Plus, Upload,
  CheckCircle2, AlertTriangle, Info, FileText, Trash2,
  ChevronDown, ChevronUp, Copy, RotateCcw, ArrowRight,
} from 'lucide-react';

// --- Helpers ------------------------------------------------------------------

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AREA_OPTIONS = ['Bedroom', 'Bathroom', 'Living Area', 'Kitchen', 'Balcony', 'TV / Electronics', 'Furniture', 'Walls / Ceiling', 'Floor', 'Closet', 'Other'];

function formatBytes(b: number) { return b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`; }
function formatDate(iso: string) { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }

function statusBadge(status: HotelGuardSessionStatus) {
  const cfg: Record<HotelGuardSessionStatus, { v: 'neutral'|'emerald'|'cyan'|'amber'|'rose'; label: string }> = {
    PENDING:             { v: 'neutral',  label: 'Not Started'           },
    CHECK_IN_RECORDED:   { v: 'emerald',  label: 'Check-In Recorded'     },
    CHECK_OUT_RECORDED:  { v: 'cyan',     label: 'Check-Out Recorded'    },
    COMPARISON_READY:    { v: 'amber',    label: 'Comparison Ready'      },
    REVIEW_REQUIRED:     { v: 'amber',    label: 'Review Required'       },
    REPORT_READY:        { v: 'emerald',  label: 'Report Ready'          },
  };
  const c = cfg[status];
  return <Badge variant={c.v}>{c.label}</Badge>;
}

// --- New Session Form ---------------------------------------------------------

function NewSessionForm({ tripId, onCreated }: { tripId: string; onCreated: (s: HotelGuardSession) => void }) {
  const { createHotelGuardSession } = useTrip();
  const [property, setProperty] = useState('');
  const [room, setRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!property.trim()) { setErr('Property name is required.'); return; }
    setSubmitting(true);
    const session = createHotelGuardSession(tripId, property.trim(), room.trim() || undefined);
    setSubmitting(false);
    if (session) onCreated(session);
    else setErr('Failed to create session. Try again.');
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
          Property / Hotel Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
        </label>
        <input
          type="text" value={property} onChange={e => setProperty(e.target.value)}
          placeholder="e.g. Grand Hyatt Paris, Room 412"
          style={{ width: '100%', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
        />
      </div>
      <div>
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 }}>
          Room / Unit Identifier <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          type="text" value={room} onChange={e => setRoom(e.target.value)}
          placeholder="e.g. Room 412, Suite B"
          style={{ width: '100%', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
        />
      </div>
      {err && <div style={{ color: 'var(--accent-rose)', fontSize: '0.82rem' }}>{err}</div>}
      <Button type="submit" isLoading={submitting} leftIcon={<Camera size={15} />}>
        Start HotelGuard Session
      </Button>
    </form>
  );
}

// --- Evidence Upload Panel ----------------------------------------------------

function EvidenceUpload({
  sessionId, tripId, evidenceType, onAdded
}: { sessionId: string; tripId: string; evidenceType: 'CHECK_IN' | 'CHECK_OUT'; onAdded: () => void }) {
  const { addHotelEvidence } = useTrip();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [area, setArea] = useState('Other');
  const [notes, setNotes] = useState('');
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const handleCameraCapture = (result: CameraSnapshotResult) => {
    setUploadErr(null);
    const evidenceId = 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const storageKey = generateEvidenceStorageKey(evidenceId);
    try { localStorage.setItem(storageKey, result.dataUrl); }
    catch { setUploadErr('Storage quota exceeded.'); return; }
    const evidence: HotelEvidence = {
      id: evidenceId, sessionId, type: evidenceType,
      filename: 'room_' + area.toLowerCase().replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.jpg',
      capturedAt: result.timestamp,
      notes: notes.trim() || undefined, size: Math.round(result.dataUrl.length * 0.75), mimeType: 'image/jpeg',
      storageKey, area,
    };
    addHotelEvidence(tripId, sessionId, evidence);
    setNotes('');
    onAdded();
  };

  const processFile = useCallback((file: File) => {
    setUploadErr(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadErr(`Unsupported file type. Accepted: JPEG, PNG, WebP, PDF.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadErr(`File too large (${formatBytes(file.size)}). Max 5 MB.`);
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const storageKey = generateEvidenceStorageKey(evidenceId);
      try { localStorage.setItem(storageKey, reader.result as string); }
      catch { setUploadErr('Storage quota exceeded.'); setUploading(false); return; }
      const evidence: HotelEvidence = {
        id: evidenceId, sessionId, type: evidenceType,
        filename: file.name, capturedAt: new Date().toISOString(),
        notes: notes.trim() || undefined, size: file.size, mimeType: file.type,
        storageKey, area,
      };
      addHotelEvidence(tripId, sessionId, evidence);
      setNotes('');
      setUploading(false);
      onAdded();
    };
    reader.onerror = () => { setUploadErr('Failed to read file.'); setUploading(false); };
    reader.readAsDataURL(file);
  }, [sessionId, tripId, evidenceType, area, notes, addHotelEvidence, onAdded]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Area:</label>
        <select value={area} onChange={e => setArea(e.target.value)}
          style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '5px 10px', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
          {AREA_OPTIONS.map(a => <option key={a} value={a} style={{ background: 'var(--color-surface)' }}>{a}</option>)}
        </select>
        <Button size="sm" variant="outline" leftIcon={<Camera size={14} />} onClick={() => setCameraModalOpen(true)}>Snap Room with Camera</Button>
      </div>
      <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Optional notes for this photo..."
        style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '0.83rem', color: 'var(--color-text-primary)' }} />
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? 'var(--accent-cyan)' : 'var(--color-border)'}`, borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--color-info-soft)' : 'var(--color-surface-muted)', transition: 'all 0.15s' }}>
        <Upload size={22} color={dragOver ? 'var(--accent-cyan)' : 'var(--text-muted)'} style={{ marginBottom: '6px' }} />
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{uploading ? 'Saving�' : 'Drop photo or click to upload'}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>JPEG, PNG, WebP, PDF � Max 5 MB � Stored locally</div>
        <input ref={fileRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} style={{ display: 'none' }} />
      </div>
      {uploadErr && <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={13} />{uploadErr}</div>}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        title={'Capture ' + (evidenceType === 'CHECK_IN' ? 'Check-In' : 'Check-Out') + ' Room Evidence'}
        instructions={'Point camera at ' + area + ' to capture room condition.'}
      />
    </div>
  );
}

// --- Evidence Gallery ---------------------------------------------------------

function EvidenceGallery({ evidence, title }: { evidence: HotelEvidence[]; title: string }) {
  if (evidence.length === 0) return (
    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem', background: 'var(--color-surface-muted)', borderRadius: '8px' }}>
      No {title.toLowerCase()} evidence captured yet.
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {evidence.map(e => (
        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-surface-muted)', borderRadius: '8px', padding: '10px 12px', border: '1px solid var(--color-border)' }}>
          <Camera size={16} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.filename}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span>{e.area || 'Unspecified area'}</span>
              <span>�</span>
              <span>{formatDate(e.capturedAt)}</span>
              <span>�</span>
              <span>{formatBytes(e.size)}</span>
            </div>
            {e.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>"{e.notes}"</div>}
          </div>
          <Badge variant="neutral" style={{ flexShrink: 0 }}>{e.type === 'CHECK_IN' ? 'In' : 'Out'}</Badge>
        </div>
      ))}
    </div>
  );
}

// --- Comparison Panel ---------------------------------------------------------

function ComparisonPanel({ session, tripId, onUpdated }: { session: HotelGuardSession; tripId: string; onUpdated: () => void }) {
  const { updateHotelGuardSession } = useTrip();
  const [notes, setNotes] = useState(session.comparison?.userNotes || '');
  const [running, setRunning] = useState(false);

  const checkIn = session.evidence.filter(e => e.type === 'CHECK_IN');
  const checkOut = session.evidence.filter(e => e.type === 'CHECK_OUT');

  function runComparison() {
    setRunning(true);
    setTimeout(() => {
      const cmp = metadataComparisonProvider.compare(session.id, checkIn, checkOut);
      updateHotelGuardSession(tripId, session.id, {
        comparison: cmp,
        status: 'REVIEW_REQUIRED',
      });
      setRunning(false);
      onUpdated();
    }, 800);
  }

  function saveReview() {
    if (!session.comparison) return;
    updateHotelGuardSession(tripId, session.id, {
      comparison: { ...session.comparison, userNotes: notes, reviewedByUser: true },
      status: 'REPORT_READY',
    });
    onUpdated();
  }

  const cmp = session.comparison;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <aside style={{ background: 'var(--color-warning-soft)', border: '1px solid rgba(184,112,32,0.3)', borderRadius: '8px', padding: '12px 14px', fontSize: '0.78rem', color: 'var(--color-warning)', display: 'flex', gap: '8px' }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Comparison is <strong>metadata-only</strong> � based on photo counts and area labels, not pixel analysis. Results say "potential change" only. Always review manually.</span>
      </aside>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: 'var(--color-surface-muted)', borderRadius: '8px', padding: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '4px' }}>Check-In</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{checkIn.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>photo{checkIn.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ background: 'var(--color-surface-muted)', borderRadius: '8px', padding: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '4px' }}>Check-Out</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{checkOut.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>photo{checkOut.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {!cmp && (
        <Button variant="outline" isLoading={running} onClick={runComparison} leftIcon={<Shield size={15} />}>
          {running ? 'Analysing�' : 'Run Metadata Comparison'}
        </Button>
      )}

      {cmp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--color-surface-muted)', borderRadius: '8px', padding: '14px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Comparison Result</span>
              <Badge variant={cmp.confidence === 'HIGH' ? 'emerald' : cmp.confidence === 'MEDIUM' ? 'amber' : 'rose'}>
                {cmp.confidence} confidence
              </Badge>
            </div>
            {cmp.missingAreas.length > 0 && (
              <div style={{ background: 'var(--color-warning-soft)', borderRadius: '6px', padding: '10px', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-warning)' }}>
                <strong>Potential Change � Needs Review:</strong> Areas in check-in not found in check-out: {cmp.missingAreas.join(', ')}
              </div>
            )}
            {cmp.missingAreas.length === 0 && (
              <div style={{ fontSize: '0.82rem', color: 'var(--color-success)' }}>
                <CheckCircle2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                All check-in areas appear to be covered at check-out.
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Compared: {formatDate(cmp.createdAt)}
            </div>
          </div>

          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>
            Your Observations <span style={{ fontWeight: 400, opacity: 0.7 }}>(required to finalize report)</span>
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={4} placeholder="Describe any visible differences, damage, missing items, or confirm the room appears unchanged..."
            style={{ width: '100%', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.88rem', color: 'var(--color-text-primary)', resize: 'vertical', fontFamily: 'var(--font-body)' }} />

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button size="sm" variant="secondary" onClick={runComparison} isLoading={running}>Re-run Comparison</Button>
            <Button size="sm" variant="primary" onClick={saveReview} disabled={!notes.trim()} leftIcon={<CheckCircle2 size={14} />}>
              Mark Reviewed &amp; Generate Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Report Panel -------------------------------------------------------------

function ReportPanel({ session }: { session: HotelGuardSession }) {
  const [copied, setCopied] = useState(false);
  const report = generateHotelGuardReport(session);

  function copyReport() {
    navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function downloadReport() {
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotelguard-report-${session.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Button size="sm" variant="secondary" onClick={copyReport} leftIcon={<Copy size={13} />}>
          {copied ? 'Copied!' : 'Copy Report'}
        </Button>
        <Button size="sm" variant="outline" onClick={downloadReport} leftIcon={<FileText size={13} />}>
          Download .txt
        </Button>
      </div>
      <pre style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', fontSize: '0.75rem', color: 'var(--color-text-primary)', overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: '400px', lineHeight: 1.5 }}>
        {report}
      </pre>
    </div>
  );
}

// --- Session Card -------------------------------------------------------------

function SessionCard({ session, tripId, onRefresh }: { session: HotelGuardSession; tripId: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'checkin'|'checkout'|'compare'|'report'>('checkin');

  const checkIn = session.evidence.filter(e => e.type === 'CHECK_IN');
  const checkOut = session.evidence.filter(e => e.type === 'CHECK_OUT');
  const canCompare = checkIn.length > 0 && checkOut.length > 0;
  const hasReport = session.status === 'REPORT_READY';

  const tabs = [
    { id: 'checkin' as const, label: `Check-In (${checkIn.length})` },
    { id: 'checkout' as const, label: `Check-Out (${checkOut.length})` },
    { id: 'compare' as const, label: 'Compare', disabled: !canCompare },
    { id: 'report' as const, label: 'Report', disabled: !hasReport },
  ];

  return (
    <div className="glass-panel" style={{ borderRadius: '14px', overflow: 'hidden', border: session.status === 'REVIEW_REQUIRED' ? '1px solid rgba(184,112,32,0.4)' : '1px solid var(--color-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setExpanded(x => !x)}>
        <Camera size={20} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.propertyName}</div>
          {session.roomIdentifier && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.roomIdentifier}</div>}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Created {formatDate(session.createdAt)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusBadge(session.status)}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                style={{ padding: '10px 16px', fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 700 : 500, borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent', color: tab.disabled ? 'var(--text-muted)' : activeTab === tab.id ? 'var(--color-accent)' : 'var(--text-secondary)', background: 'none', cursor: tab.disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px 18px' }}>
            {activeTab === 'checkin' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <EvidenceGallery evidence={checkIn} title="check-in" />
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>ADD CHECK-IN EVIDENCE</div>
                  <EvidenceUpload sessionId={session.id} tripId={tripId} evidenceType="CHECK_IN" onAdded={onRefresh} />
                </div>
              </div>
            )}
            {activeTab === 'checkout' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <EvidenceGallery evidence={checkOut} title="check-out" />
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>ADD CHECK-OUT EVIDENCE</div>
                  <EvidenceUpload sessionId={session.id} tripId={tripId} evidenceType="CHECK_OUT" onAdded={onRefresh} />
                </div>
              </div>
            )}
            {activeTab === 'compare' && canCompare && (
              <ComparisonPanel session={session} tripId={tripId} onUpdated={onRefresh} />
            )}
            {activeTab === 'report' && hasReport && (
              <ReportPanel session={session} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main HotelGuardSection ---------------------------------------------------

export function HotelGuardSection({ tripId }: { tripId: string }) {
  const { getTripById } = useTrip();
  const [showNewForm, setShowNewForm] = useState(false);
  const [, forceUpdate] = useState(0);

  const trip = getTripById(tripId);
  const sessions = trip?.hotelGuardSessions || [];

  function handleCreated() { setShowNewForm(false); forceUpdate(x => x + 1); }
  function handleRefresh() { forceUpdate(x => x + 1); }

  if (!trip) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-heading-lg)', fontFamily: 'var(--font-display)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Camera size={22} color="var(--accent-amber)" />
              HotelGuard
            </h2>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
              Protect your stay with timestamped room evidence. Check-In ? Evidence ? Check-Out ? Compare ? Report.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Badge variant="neutral">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</Badge>
            {sessions.some(s => s.status === 'REVIEW_REQUIRED') && (
              <Badge variant="amber"><AlertTriangle size={11} style={{ marginRight: '3px' }} />Review Required</Badge>
            )}
            <Button size="sm" variant="primary" onClick={() => setShowNewForm(x => !x)} leftIcon={<Plus size={14} />}>
              New Session
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <aside style={{ background: 'var(--color-warning-soft)', border: '1px solid rgba(184,112,32,0.3)', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px' }}>
        <Info size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '3px' }}>HotelGuard Limitations</div>
          <div style={{ fontSize: '0.77rem', color: 'var(--color-text-secondary)' }}>{HOTELGUARD_DISCLAIMER}</div>
        </div>
      </aside>

      {/* New session form */}
      {showNewForm && (
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 'var(--text-heading-md)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Start New HotelGuard Session
          </h3>
          <NewSessionForm tripId={tripId} onCreated={handleCreated} />
        </div>
      )}

      {/* Session list */}
      {sessions.length === 0 && !showNewForm && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <ShieldCheck size={40} color="var(--accent-amber)" style={{ opacity: 0.4, marginBottom: '14px' }} />
          <div style={{ fontSize: 'var(--text-heading-md)', fontWeight: 700, marginBottom: '6px' }}>No HotelGuard Sessions Yet</div>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
            Start a session to record timestamped evidence of your room at check-in and check-out.
          </div>
          <Button onClick={() => setShowNewForm(true)} leftIcon={<Camera size={15} />}>
            Start First Session
          </Button>
        </div>
      )}

      {sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-muted)', paddingLeft: '4px' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} � click to expand and manage evidence.
          </div>
          {[...sessions].reverse().map(session => (
            <SessionCard key={session.id} session={session} tripId={tripId} onRefresh={handleRefresh} />
          ))}
        </div>
      )}

      {/* Local processing notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        <Shield size={11} />
        All evidence is stored locally on your device. Photos are never automatically sent to cloud servers.
      </div>
    </div>
  );
}
