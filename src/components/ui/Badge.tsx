'use client';

import React from 'react';
import { DataTrustLabel, TripStatus } from '@/types/trip';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'trust' | 'status' | 'neutral' | 'accent' | 'cyan' | 'emerald' | 'amber' | 'rose';
  trustLabel?: DataTrustLabel;
  tripStatus?: TripStatus;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  trustLabel,
  tripStatus,
  style,
}) => {
  if (trustLabel) {
    const labelLower = trustLabel.toLowerCase();
    return (
      <span className={`badge-trust badge-trust-${labelLower}`} style={style}>
        {trustLabel} DATA TRUST
      </span>
    );
  }

  if (tripStatus) {
    const getStatusColor = () => {
      switch (tripStatus) {
        case 'active':
          return { bg: 'var(--color-success-soft, #d8f0e6)', color: 'var(--color-success, #2d6a4f)', border: 'rgba(45, 106, 79, 0.3)' };
        case 'upcoming':
          return { bg: 'var(--color-info-soft, #ddeeff)', color: 'var(--color-info, #1a6fb5)', border: 'rgba(26, 111, 181, 0.3)' };
        case 'completed':
          return { bg: 'var(--color-surface-muted, #f4f0ea)', color: 'var(--color-text-secondary, #6b5c4e)', border: 'var(--color-border, #e0d5c8)' };
        case 'draft':
          return { bg: 'var(--color-warning-soft, #fdf0d8)', color: 'var(--color-warning, #b87020)', border: 'rgba(184, 112, 32, 0.3)' };
      }
    };
    const colors = getStatusColor();
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 10px',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          background: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          ...style,
        }}
      >
        ● {tripStatus}
      </span>
    );
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'cyan':
        return { background: 'var(--color-info-soft, #ddeeff)', color: 'var(--color-info, #1a6fb5)', border: '1px solid rgba(26, 111, 181, 0.3)' };
      case 'emerald':
        return { background: 'var(--color-success-soft, #d8f0e6)', color: 'var(--color-success, #2d6a4f)', border: '1px solid rgba(45, 106, 79, 0.3)' };
      case 'amber':
        return { background: 'var(--color-warning-soft, #fdf0d8)', color: 'var(--color-warning, #b87020)', border: '1px solid rgba(184, 112, 32, 0.3)' };
      case 'rose':
        return { background: 'var(--color-danger-soft, #fce8e8)', color: 'var(--color-danger, #a82020)', border: '1px solid rgba(168, 32, 32, 0.3)' };
      case 'accent':
        return { background: 'var(--color-accent-soft, #f2e6db)', color: 'var(--color-accent, #b5541a)', border: '1px solid rgba(181, 84, 26, 0.3)' };
      case 'neutral':
      default:
        return { background: 'var(--color-surface-muted, #f4f0ea)', color: 'var(--color-text-secondary, #6b5c4e)', border: '1px solid var(--color-border, #e0d5c8)' };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...getVariantStyles(),
        ...style,
      }}
    >
      {children}
    </span>
  );
};
