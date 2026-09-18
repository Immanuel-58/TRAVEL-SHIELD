'use client';

import React, { useState } from 'react';
import { Laptop, Smartphone, Copy, Download, Upload, Check, AlertCircle, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { OfficeKitBridge, OfficeKitSyncPacket } from '@/services/device/OfficeKitBridge';
import { useTrip } from '@/context/TripContext';
import { Button } from './Button';

export interface OfficeKitSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficeKitSyncModal({ isOpen, onClose }: OfficeKitSyncModalProps) {
  const { activeTrip, importTripData } = useTrip();
  const [copied, setCopied] = useState<boolean>(false);
  const [pasteInput, setPasteInput] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen || !activeTrip) return null;

  const handleCopyClipboard = async () => {
    const packet = OfficeKitBridge.generateSyncPacket(activeTrip, 'MOBILE_PHONE');
    const res = await OfficeKitBridge.copyPacketToClipboard(packet);
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadFile = () => {
    const packet = OfficeKitBridge.generateSyncPacket(activeTrip, 'MOBILE_PHONE');
    OfficeKitBridge.downloadSyncFile(packet);
  };

  const handleImport = () => {
    setImportStatus(null);
    if (!pasteInput.trim()) {
      setImportStatus({ success: false, message: 'Please paste a valid Office Kit JSON packet.' });
      return;
    }

    const { packet, error } = OfficeKitBridge.parseSyncPacket(pasteInput);
    if (error || !packet) {
      setImportStatus({ success: false, message: error || 'Failed to parse packet.' });
      return;
    }

    // Merge into local trip context
    importTripData(packet.tripData);

    setImportStatus({
      success: true,
      message: `Successfully synchronized trip "${packet.tripName}"! Synced ${packet.syncSummary.itineraryCount} activities, ${packet.syncSummary.expensesCount} expenses, and ${packet.syncSummary.documentsCount} documents.`,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(28, 20, 16, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-lg, 16px)',
        border: '1px solid var(--color-border, #e0d5c8)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '580px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border, #e0d5c8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface-muted, #f4f0ea)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Laptop size={18} color="var(--color-accent, #b5541a)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary, #1c1410)' }}>
              Office Kit Phone ↔ Laptop Bridge
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '6px', color: 'var(--color-text-muted)', cursor: 'pointer', borderRadius: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Workflow Diagram */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--color-bg, #faf8f5)',
          borderBottom: '1px solid var(--color-border, #e0d5c8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={16} color="var(--color-accent, #b5541a)" />
            <span><strong>Phone:</strong> Capture & PII Mask</span>
          </div>
          <ArrowRight size={14} color="var(--color-text-muted)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', background: 'var(--color-accent-soft)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: 'var(--color-accent)' }}>
              Office Kit Shared Clipboard
            </span>
          </div>
          <ArrowRight size={14} color="var(--color-text-muted)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Laptop size={16} color="#1a6fb5" />
            <span><strong>Laptop:</strong> Wide Command Center</span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Section 1: Phone -> Laptop (Export) */}
          <div style={{
            background: 'var(--color-surface-muted, #f4f0ea)',
            padding: '16px',
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--color-border, #e0d5c8)',
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary, #1c1410)' }}>
              1. Export to Laptop via Office Kit
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b5c4e)', marginBottom: '12px' }}>
              Transfers your active trip ({activeTrip.name}), local expenses, HotelGuard photos, and masked documents to your laptop workspace.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button
                size="sm"
                variant={copied ? 'outline' : 'primary'}
                leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                onClick={handleCopyClipboard}
              >
                {copied ? 'Copied to Shared Clipboard!' : 'Copy to Shared Clipboard'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download size={14} />}
                onClick={handleDownloadFile}
              >
                Download Transfer JSON
              </Button>
            </div>
          </div>

          {/* Section 2: Laptop -> Phone (Import) */}
          <div style={{
            background: 'var(--color-surface-muted, #f4f0ea)',
            padding: '16px',
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--color-border, #e0d5c8)',
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary, #1c1410)' }}>
              2. Import Laptop Updates into Phone
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b5c4e)', marginBottom: '12px' }}>
              Paste the synchronization packet exported from your laptop Command Center to update this phone.
            </p>

            <textarea
              rows={3}
              value={pasteInput}
              onChange={e => setPasteInput(e.target.value)}
              placeholder='Paste Office Kit JSON payload here...'
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1px solid var(--color-border, #e0d5c8)',
                background: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-primary, #1c1410)',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                marginBottom: '10px',
              }}
            />

            <Button
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={handleImport}
            >
              Apply Office Kit Sync
            </Button>

            {importStatus && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                background: importStatus.success ? 'var(--color-success-soft, #d8f0e6)' : 'var(--color-danger-soft, #fce8e8)',
                color: importStatus.success ? 'var(--color-success, #2d6a4f)' : 'var(--color-danger, #a82020)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {importStatus.success ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--color-surface, #ffffff)',
          borderTop: '1px solid var(--color-border, #e0d5c8)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
