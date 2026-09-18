'use client';

import React from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Wallet, Receipt, ArrowRight, DollarSign, TrendingUp, CreditCard } from 'lucide-react';

export default function GlobalExpensesPage() {
  const { trips } = useTrip();

  const totalExpensesCount = trips.reduce((sum, t) => sum + (t.expenses?.length || 0), 0);
  const tripsWithExpenses = trips.filter(t => t.expenses && t.expenses.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet size={26} color="var(--accent-terracotta)" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Global Travel Expenses
          </h1>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
          Expenses and currency conversions are organized within each trip workspace. Select a trip below to view its multi-currency ledger and budget pacing.
        </p>
      </div>

      {/* Summary KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '18px', textAlign: 'center' }}>
          <Receipt size={24} color="var(--accent-terracotta)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{totalExpensesCount}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Total Logged Transactions</div>
        </Card>

        <Card style={{ padding: '18px', textAlign: 'center' }}>
          <CreditCard size={24} color="var(--accent-cyan)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{tripsWithExpenses.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Trips with Active Ledgers</div>
        </Card>

        <Card style={{ padding: '18px', textAlign: 'center' }}>
          <DollarSign size={24} color="var(--accent-emerald)" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{trips.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Total Travel Itineraries</div>
        </Card>
      </div>

      {/* Per-trip Expense Ledgers */}
      {trips.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            No trips found. Create a trip to begin tracking travel expenditures.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {trips.map(trip => {
            const expList = trip.expenses || [];
            const baseCurr = trip.currency || 'USD';
            const totalSpent = expList.reduce((sum, e) => sum + (e.baseAmount || 0), 0);
            const totalBudget = trip.budget || 0;

            return (
              <Card key={trip.id} style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>{trip.name}</span>
                    <Badge variant="accent" style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff', fontSize: '0.72rem' }}>
                      {baseCurr}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{trip.destination}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Spent / Budget</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {baseCurr} {totalSpent.toFixed(2)} / {totalBudget.toLocaleString()}
                    </div>
                  </div>

                  <Badge variant="neutral" style={{ fontSize: '0.8rem' }}>
                    {expList.length} expense{expList.length !== 1 ? 's' : ''}
                  </Badge>

                  <Link href={`/trips/${trip.id}/expenses`}>
                    <Button size="sm" variant="primary" style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Open Ledger</span>
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

