'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTrip } from '@/context/TripContext';
import { TripDocument, TripDocumentType, DocumentPrivacyStatus, SensitiveMatch } from '@/types/travel';
import { localDocumentProcessor, SCANNER_DISCLAIMER, REDACTION_DISCLAIMER, getStorageKey } from '@/services/documents/LocalDocumentProcessor';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CameraCaptureModal } from '@/components/ui/CameraCaptureModal';
import { CameraSnapshotResult } from '@/services/device/CameraProvider';
import {
  FileLock2,
  Upload,
  Camera,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Share2,
  Lock,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<TripDocumentType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  flight: 'Flight Ticket',
  hotel: 'Hotel Booking',
  insurance: 'Insurance',
  identity: 'Identity Document',
  other: 'Other',
};

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function privacyStatusBadge(status: DocumentPrivacyStatus): React.ReactElement {
  const config: Record<DocumentPrivacyStatus, { variant: 'neutral' | 'amber' | 'emerald' | 'rose'; label: string }> = {
    UNSCANNED:            { variant: 'neutral', label: 'Unscanned' },
    SCANNED:              { variant: 'emerald', label: 'Scanned — No Issues' },
    SENSITIVE_DATA_FOUND: { variant: 'amber',   label: 'Sensitive Data Found' },
    USER_REVIEW_REQUIRED: { variant: 'amber',   label: 'Review Required' },
    REDACTED:             { variant: 'rose',    label: 'Flagged Redacted' },
    PROTECTED_COPY:       { variant: 'emerald', label: 'Protected Copy' },
  };
  const c = config[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function docTypeIcon(docType: TripDocumentType): React.ReactElement {
  const color = 'var(--accent-indigo)';
  return <FileText size={18} color={color} />;
}

// ─── Safe Sharing Modal ───────────────────────────────────────────────────────

interface SafeSharingModalProps {
  doc: TripDocument;
  onClose: () => void;
  onMark: (status: DocumentPrivacyStatus) => void;
}

function SafeSharingModal({ doc, onClose, onMark }: SafeSharingModalProps) {
  const [recipient, setRecipient] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [marked, setMarked] = useState(false);

  function handleMark() {
    onMark('PROTECTED_COPY');
    setMarked(true);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px', padding: '28px',
        borderRadius: '16px', position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
        }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Share2 size={20} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Safe Sharing Setup</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Specify who you are sharing with and why. A visual watermark note will be added to this document record.
        </p>

        <aside style={{
          background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px', padding: '12px', marginBottom: '20px',
          fontSize: '0.78rem', color: '#fbbf24',
        }}>
          <strong>⚠ Important:</strong> This creates a metadata record only. It does NOT digitally watermark or permanently modify the underlying file. Do not share files assuming they are protected without this understanding.
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Recipient
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="e.g. Embassy, Hotel Check-in, Airline..."
              style={{
                display: 'block', width: '100%', marginTop: '6px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.88rem',
              }}
            />
          </label>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Purpose
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Visa application, Hotel check-in..."
              style={{
                display: 'block', width: '100%', marginTop: '6px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.88rem',
              }}
            />
          </label>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Expires in (days)
            <input
              type="number"
              value={expiryDays}
              onChange={e => setExpiryDays(e.target.value)}
              min="1" max="365"
              style={{
                display: 'block', width: '100%', marginTop: '6px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.88rem',
              }}
            />
          </label>
        </div>

        {marked ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#34d399', fontSize: '0.88rem', padding: '10px 0',
          }}>
            <CheckCircle2 size={18} />
            Marked as Protected Copy. Recipient: <strong>{recipient || '—'}</strong>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              onClick={handleMark}
              disabled={!recipient.trim()}
              leftIcon={<Lock size={14} />}
            >
              Mark as Protected Copy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocCardProps {
  doc: TripDocument;
  tripId: string;
  onUpdate: (docId: string, updates: Partial<TripDocument>) => void;
  onDelete: (docId: string) => void;
}

function DocCard({ doc, tripId, onUpdate, onDelete }: DocCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(doc.notes || '');
  const [scanning, setScanning] = useState(false);
  const [showSharing, setShowSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleScan() {
    setScanning(true);
    setTimeout(() => {
      const matches = localDocumentProcessor.scan(notes, doc.filename);
      const newStatus: DocumentPrivacyStatus = matches.length > 0
        ? 'SENSITIVE_DATA_FOUND'
        : 'SCANNED';
      onUpdate(doc.id, { privacyStatus: newStatus, sensitiveMatches: matches, notes });
      setScanning(false);
    }, 600);
  }

  function handleSaveNotes() {
    onUpdate(doc.id, { notes });
  }

  function handleStatusChange(status: DocumentPrivacyStatus) {
    onUpdate(doc.id, { privacyStatus: status });
  }

  return (
    <>
      {showSharing && (
        <SafeSharingModal
          doc={doc}
          onClose={() => setShowSharing(false)}
          onMark={(status) => {
            onUpdate(doc.id, { privacyStatus: status });
            setShowSharing(false);
          }}
        />
      )}

      <div className="glass-panel" style={{
        borderRadius: '12px', overflow: 'hidden',
        border: doc.privacyStatus === 'SENSITIVE_DATA_FOUND' || doc.privacyStatus === 'USER_REVIEW_REQUIRED'
          ? '1px solid rgba(245, 158, 11, 0.4)'
          : '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px', cursor: 'pointer',
        }} onClick={() => setExpanded(e => !e)}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {docTypeIcon(doc.docType)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {doc.filename}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{DOC_TYPE_LABELS[doc.docType]}</span>
              <span>·</span>
              <span>{formatBytes(doc.size)}</span>
              <span>·</span>
              <span>{formatDate(doc.uploadedAt)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {privacyStatusBadge(doc.privacyStatus)}
            {expanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>

            {/* Sensitive matches */}
            {doc.sensitiveMatches && doc.sensitiveMatches.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px', padding: '12px', marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 600 }}>
                  <ShieldAlert size={15} />
                  Potential Sensitive Data Detected in Notes/Filename
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {doc.sensitiveMatches.map((m, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{m.field}</span>
                      <code style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{m.example}</code>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange('USER_REVIEW_REQUIRED')}
                    leftIcon={<Eye size={13} />}>
                    Mark: Needs Review
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange('REDACTED')}
                    leftIcon={<EyeOff size={13} />}>
                    Flag as Redacted
                  </Button>
                </div>
              </div>
            )}

            {/* Notes field */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Notes / Description <span style={{ opacity: 0.6 }}>(also used for privacy scanning)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add context, booking references, or any text you want scanned..."
                rows={3}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                  padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.85rem',
                  resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button size="sm" variant="secondary" onClick={handleSaveNotes}>
                Save Notes
              </Button>
              <Button
                size="sm" variant="outline"
                isLoading={scanning}
                onClick={handleScan}
                leftIcon={<Shield size={13} />}
              >
                {scanning ? 'Scanning...' : 'Run Privacy Scan'}
              </Button>
              {(doc.privacyStatus === 'SCANNED' || doc.privacyStatus === 'REDACTED') && (
                <Button size="sm" variant="secondary" onClick={() => setShowSharing(true)}
                  leftIcon={<Share2 size={13} />}>
                  Safe Sharing
                </Button>
              )}
              <Button
                size="sm" variant="danger"
                onClick={() => setConfirmDelete(true)}
                leftIcon={<Trash2 size={13} />}
              >
                Delete
              </Button>
            </div>

            {/* Confirm delete */}
            {confirmDelete && (
              <div style={{
                marginTop: '12px', background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px',
                padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
              }}>
                <span style={{ fontSize: '0.82rem', color: '#fb7185' }}>Remove this document from the vault?</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(doc.id)}>Delete</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main DocumentVaultSection ────────────────────────────────────────────────

export function DocumentVaultSection({ tripId }: { tripId: string }) {
  const { getTripById, addDocument, removeDocument, updateDocument } = useTrip();
  const trip = getTripById(tripId);
  const documents = trip?.documents || [];

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingDocType, setPendingDocType] = useState<TripDocumentType>('other');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCapture = (result: CameraSnapshotResult) => {
    setUploadError(null);
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storageKey = getStorageKey(docId);
    try {
      localStorage.setItem(storageKey, result.dataUrl);
    } catch {
      setUploadError('Storage quota exceeded. Try removing other documents first.');
      return;
    }
    const doc: TripDocument = {
      id: docId,
      tripId,
      filename: `camera_scan_${new Date().toISOString().slice(0, 10)}.jpg`,
      docType: pendingDocType,
      size: Math.round(result.dataUrl.length * 0.75),
      mimeType: 'image/jpeg',
      uploadedAt: result.timestamp,
      privacyStatus: 'UNSCANNED',
      storageKey,
    };
    addDocument(tripId, doc);
  };

  const processFile = useCallback((file: File) => {
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError(`Unsupported file type "${file.type}". Accepted: PDF, JPEG, PNG, WebP.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`File too large (${formatBytes(file.size)}). Maximum size is 5 MB.`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const storageKey = getStorageKey(docId);
      try {
        localStorage.setItem(storageKey, base64);
      } catch {
        setUploadError('Storage quota exceeded. Try removing other documents first.');
        setUploading(false);
        return;
      }
      const doc: TripDocument = {
        id: docId,
        tripId,
        filename: file.name,
        docType: pendingDocType,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        privacyStatus: 'UNSCANNED',
        storageKey,
      };
      addDocument(tripId, doc);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, [tripId, pendingDocType, addDocument]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleDelete(docId: string) {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      try { localStorage.removeItem(doc.storageKey); } catch { /* ignore */ }
    }
    removeDocument(tripId, docId);
  }

  function handleUpdate(docId: string, updates: Partial<TripDocument>) {
    updateDocument(tripId, docId, updates);
  }

  if (!trip) return null;

  const sensitiveCount = documents.filter(d =>
    d.privacyStatus === 'SENSITIVE_DATA_FOUND' || d.privacyStatus === 'USER_REVIEW_REQUIRED'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileLock2 size={20} color="var(--accent-indigo)" />
              Document Vault &amp; Privacy Sentinel
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Upload → Privacy Scan → Review → Protect → Safe Share
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {sensitiveCount > 0 && (
              <Badge variant="amber">
                <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                {sensitiveCount} doc{sensitiveCount !== 1 ? 's' : ''} need review
              </Badge>
            )}
            <Badge variant="neutral">{documents.length} document{documents.length !== 1 ? 's' : ''}</Badge>
          </div>
        </div>
      </div>

      {/* Disclaimer banners */}
      <aside style={{
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start',
      }}>
        <Info size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600, marginBottom: '4px' }}>Privacy Scan Limitations</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{SCANNER_DISCLAIMER}</div>
        </div>
      </aside>
      <aside style={{
        background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)',
        borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start',
      }}>
        <AlertTriangle size={16} color="#fb7185" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '0.8rem', color: '#fb7185', fontWeight: 600, marginBottom: '4px' }}>Redaction Disclaimer</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{REDACTION_DISCLAIMER}</div>
        </div>
      </aside>

      {/* Upload area */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Document type:</label>
          <select
            value={pendingDocType}
            onChange={e => setPendingDocType(e.target.value as TripDocumentType)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '7px 12px', color: 'var(--text-primary)', fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {(Object.keys(DOC_TYPE_LABELS) as TripDocumentType[]).map(t => (
              <option key={t} value={t} style={{ background: '#1e293b' }}>{DOC_TYPE_LABELS[t]}</option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Camera size={14} />}
            onClick={() => setCameraModalOpen(true)}
          >
            Snap with Camera
          </Button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '12px',
            padding: '32px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.02)',
            transition: 'all 0.2s',
          }}
        >
          <Upload size={28} color={dragOver ? 'var(--accent-cyan)' : 'var(--text-secondary)'} style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
            {uploading ? 'Processing…' : 'Drag & drop or click to upload'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            PDF, JPEG, PNG, WebP · Max 5 MB · Stored locally on your device
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>

        {uploadError && (
          <div style={{
            marginTop: '12px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '8px', padding: '10px 14px', color: '#fb7185', fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle size={15} />
            {uploadError}
          </div>
        )}
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <ShieldCheck size={36} color="var(--accent-indigo)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px' }}>No documents yet</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Upload your travel documents above to get started.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} in vault — click a document to expand and scan.
          </div>
          {documents.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              tripId={tripId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Local processing notice */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '4px 0',
      }}>
        <Lock size={12} />
        All document storage is local to your device. Files are never automatically sent to cloud servers.
      </div>

      {/* Camera Capture Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        title="Snap Travel Document"
        instructions="Hold your passport, visa, or ticket flat and steady inside the frame."
      />
    </div>
  );
}
