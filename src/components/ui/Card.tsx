'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #e0d5c8)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--color-text-primary, #1c1410)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        ...style,
      }}
      className={`glass-card ${hoverable ? 'hoverable-card' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
