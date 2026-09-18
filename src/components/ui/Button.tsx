'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--color-accent)',
          color: '#ffffff',
          border: '1px solid var(--color-accent)',
          boxShadow: '0 2px 6px rgba(181,84,26,0.25)',
        };
      case 'secondary':
        return {
          background: 'var(--color-surface-muted)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--color-text-secondary)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          background: 'var(--color-danger-soft)',
          color: 'var(--color-danger)',
          border: '1px solid rgba(168,32,32,0.3)',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' };
      case 'lg':
        return { padding: '14px 24px', fontSize: '1rem', borderRadius: 'var(--radius-md)' };
      case 'md':
      default:
        return { padding: '9px 18px', fontSize: '0.88rem', borderRadius: 'var(--radius-sm)' };
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.55 : 1,
        transition: 'all var(--transition-fast)',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      className={className}
      {...props}
    >
      {isLoading ? (
        <span style={{
          width: '13px', height: '13px',
          border: '2px solid currentColor', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
      ) : (
        <>
          {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
