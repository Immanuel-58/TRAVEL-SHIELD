'use client';

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(12, 16, 26, 0.8)',
        padding: '4px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        overflowX: 'auto',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {tab.icon && <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
