'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, ShieldCheck, AlertCircle, Upload } from 'lucide-react';
import { cameraProvider, CameraSnapshotResult } from '@/services/device/CameraProvider';
import { Button } from './Button';

export interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (result: CameraSnapshotResult) => void;
  title?: string;
  instructions?: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Take Photo with Camera',
  instructions = 'Align your document, receipt, or room inside the frame and snap.',
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [snapshot, setSnapshot] = useState<CameraSnapshotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const cleanup = React.useCallback(() => {
    if (stream) {
      cameraProvider.stopViewfinder(stream);
      setStream(null);
    }
    setSnapshot(null);
    setError(null);
    setIsLoading(false);
  }, [stream]);

  const startCamera = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSnapshot(null);

    try {
      if (videoRef.current) {
        const mediaStream = await cameraProvider.startViewfinder(videoRef.current);
        setStream(mediaStream);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to access camera. You can use the device file picker fallback below.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startCamera();

    return () => {
      cleanup();
    };
  }, [isOpen, cleanup, startCamera]);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const result = cameraProvider.captureSnapshot(videoRef.current);
    if (result) {
      setSnapshot(result);
    } else {
      setError('Failed to capture frame from video stream.');
    }
  };

  const handleRetake = () => {
    setSnapshot(null);
  };

  const handleConfirm = () => {
    if (snapshot) {
      onCapture(snapshot);
      onClose();
    }
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const result: CameraSnapshotResult = {
        dataUrl,
        timestamp: new Date().toISOString(),
        source: 'LOCAL_FILE_CAPTURE',
        dimensions: { width: 1280, height: 720 },
      };
      onCapture(result);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

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
        maxWidth: '540px',
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
            <Camera size={18} color="var(--color-accent, #b5541a)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary, #1c1410)' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '6px', color: 'var(--color-text-muted)', cursor: 'pointer', borderRadius: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Instructions & Trust Label */}
        <div style={{
          padding: '10px 20px',
          background: 'var(--color-bg, #faf8f5)',
          borderBottom: '1px solid var(--color-border, #e0d5c8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
        }}>
          <span style={{ color: 'var(--color-text-secondary, #6b5c4e)' }}>{instructions}</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--color-success, #2d6a4f)',
            fontWeight: 700,
            background: 'rgba(45, 106, 79, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px',
          }}>
            <ShieldCheck size={12} /> LOCAL ONLY
          </span>
        </div>

        {/* Viewfinder / Snapshot Area */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '320px',
          background: '#0a0d14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {isLoading && (
            <div style={{ color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={24} className="animate-spin" />
              <span style={{ fontSize: '0.85rem' }}>Initializing camera hardware...</span>
            </div>
          )}

          {error && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#ffffff' }}>
              <AlertCircle size={32} color="#f87171" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.88rem', marginBottom: '16px', color: '#fca5a5' }}>{error}</p>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Use Device Camera / Gallery
              </Button>
            </div>
          )}

          {/* Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: !snapshot && !error && !isLoading ? 'block' : 'none',
            }}
          />

          {/* Captured Snapshot Preview */}
          {snapshot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshot.dataUrl}
              alt="Camera capture preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000000',
              }}
            />
          )}

          {/* In-app guide reticle */}
          {!snapshot && !error && !isLoading && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: '2px dashed rgba(255, 255, 255, 0.4)',
              borderRadius: '12px',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Hidden mobile fallback input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFallbackFile}
          style={{ display: 'none' }}
        />

        {/* Controls */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-surface, #ffffff)',
          borderTop: '1px solid var(--color-border, #e0d5c8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {!snapshot ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary, #6b5c4e)',
                  cursor: 'pointer',
                }}
              >
                <Upload size={14} /> Native Camera Intent
              </button>

              <Button
                size="md"
                leftIcon={<Camera size={16} />}
                onClick={handleSnap}
                disabled={isLoading || Boolean(error)}
              >
                Snap Photo
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="md"
                leftIcon={<RefreshCw size={14} />}
                onClick={handleRetake}
              >
                Retake
              </Button>

              <Button
                size="md"
                leftIcon={<Check size={16} />}
                onClick={handleConfirm}
              >
                Use Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
