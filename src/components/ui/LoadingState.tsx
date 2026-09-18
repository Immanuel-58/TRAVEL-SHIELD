'use client';

import React from 'react';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading TravelShield AI...' }) => {
  return (
    <div style={{
      minHeight: '280px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(6, 182, 212, 0.2)',
        borderTopColor: 'var(--accent-cyan)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {message}
      </span>
    </div>
  );
};
