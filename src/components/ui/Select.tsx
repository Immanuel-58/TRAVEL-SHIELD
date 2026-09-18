'use client';

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  requiredField?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  requiredField = false,
  style,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label htmlFor={selectId} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label} {requiredField && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
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
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: 'var(--color-surface, #ffffff)', color: 'var(--color-text-primary, #1c1410)' }}>
            {opt.label}
          </option>
        ))}
      </select>

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

Select.displayName = 'Select';
