'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
}) => {
  return (
    <div style={{
      padding: '32px 24px',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(244, 63, 94, 0.08)',
      border: '1px solid rgba(244, 63, 94, 0.25)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        padding: '12px',
        borderRadius: '50%',
        background: 'rgba(244, 63, 94, 0.15)',
        color: '#fb7185',
      }}>
        <AlertTriangle size={24} />
      </div>

      <h4 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{title}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #6b5c4e)', maxWidth: '400px' }}>
        {message}
      </p>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} style={{ marginTop: '8px' }}>
          Try Again
        </Button>
      )}
    </div>
  );
};
