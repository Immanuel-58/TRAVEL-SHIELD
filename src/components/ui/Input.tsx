'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredField?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  requiredField = false,
  style,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label} {requiredField && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        style={{
          width: '100%',
          padding: '11px 16px',
          borderRadius: '8px',
          background: 'var(--color-surface, #ffffff)',
          border: error ? '1px solid var(--color-danger, #a82020)' : '1px solid var(--color-border, #e0d5c8)',
          color: 'var(--color-text-primary, #1c1410)',
          fontSize: '0.9rem',
          fontFamily: 'var(--font-body)',
          outline: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: 'var(--shadow-sm)',
          ...style,
        }}
        {...props}
      />

      {error && (
        <span style={{ fontSize: '0.78rem', color: '#fb7185', fontWeight: 500 }}>
          {error}
        </span>
      )}

      {!error && helperText && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
