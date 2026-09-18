'use client';

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface-muted, #f4f0ea)',
        border: '1px dashed var(--color-border, #e0d5c8)',
        ...style,
      }}
    >
      {icon && (
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'var(--color-accent-soft, #f2e6db)',
          border: '1px solid rgba(181, 84, 26, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-accent, #b5541a)',
          marginBottom: '16px',
        }}>
          {icon}
        </div>
      )}

      <h4 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
        {title}
      </h4>

      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary, #6b5c4e)', maxWidth: '440px', lineHeight: 1.5, marginBottom: actionLabel ? '20px' : 0 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
