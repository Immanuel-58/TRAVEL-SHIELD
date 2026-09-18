'use client';

import React, { useState } from 'react';
import { useTrip } from '@/context/TripContext';
import { PlanningService } from '@/services/travel/PlanningService';
import { TravelEngine } from '@/services/travel/TravelEngine';
import { BudgetCategory } from '@/types/travel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Wallet, 
  Plus, 
  TrendingDown, 
  ShieldCheck, 
  PieChart, 
  AlertCircle, 
  Plane, 
  Hotel, 
  Utensils, 
  Car, 
  Ticket, 
  ShoppingBag, 
  Shield, 
  LifeBuoy, 
  Package
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  flights: <Plane size={16} color="var(--accent-cyan)" />,
  accommodation: <Hotel size={16} color="var(--accent-emerald)" />,
  food: <Utensils size={16} color="var(--accent-amber)" />,
  local_transport: <Car size={16} color="var(--accent-indigo)" />,
  activities: <Ticket size={16} color="var(--accent-purple)" />,
  shopping: <ShoppingBag size={16} color="var(--accent-rose)" />,
  insurance: <Shield size={16} color="var(--accent-cyan)" />,
  emergency: <LifeBuoy size={16} color="var(--accent-amber)" />,
  miscellaneous: <Package size={16} color="var(--text-muted)" />,
};

const ALL_CATEGORIES: Array<{ value: BudgetCategory; label: string }> = [
  { value: 'flights', label: 'Flights & Aviation' },
  { value: 'accommodation', label: 'Accommodation & Hotels' },
  { value: 'food', label: 'Food & Gastronomy' },
  { value: 'local_transport', label: 'Local Transport & Transit' },
  { value: 'activities', label: 'Activities & Sightseeing' },
  { value: 'shopping', label: 'Shopping & Souvenirs' },
  { value: 'insurance', label: 'Travel Insurance' },
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'miscellaneous', label: 'Miscellaneous Expenses' },
];

export function BudgetSection({ tripId }: { tripId?: string }) {
  const { activeTrip, getTripById, addExpense, updateTripBudget } = useTrip();
  const trip = tripId ? getTripById(tripId) : activeTrip;

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<BudgetCategory>('food');

  const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
  const [targetBudgetInput, setTargetBudgetInput] = useState('');

  if (!trip) return null;

  const budget = trip.structuredBudget || PlanningService.generateInitialTripPlan(trip).budget;

  const totalBudget = budget.totalBudget || trip.budget || 0;
  const estimatedTotal = budget.estimatedTotal || 0;
  const totalFromExpenses = (trip.expenses || []).reduce((s, e) => s + (e.baseAmount || e.amount || 0), 0);
  const actualSpent = Math.max(budget.actualSpent || 0, totalFromExpenses);
  const remainingBudget = TravelEngine.calculateRemainingBudget(totalBudget, actualSpent);
  const emergencyBuffer = budget.emergencyBuffer || TravelEngine.calculateEmergencyBuffer(totalBudget, 10);
  const currency = budget.currency || trip.currency || 'USD';

  const categories = ALL_CATEGORIES.map(cat => {
    const existing = budget.categories?.find(c => c.category === cat.value);
    const categoryExpensesTotal = (trip.expenses || [])
      .filter(e => TravelEngine.normalizeCategory(e.category) === cat.value)
      .reduce((s, e) => s + (e.baseAmount || e.amount || 0), 0);
    const spentAmount = Math.max(existing?.spentAmount || 0, categoryExpensesTotal);

    return {
      category: cat.value,
      name: cat.label,
      allocatedAmount: existing?.allocatedAmount || 0,
      estimatedCost: existing?.estimatedCost || 0,
      spentAmount,
      trustLabel: existing?.trustLabel || 'ESTIMATED',
    };
  });

  const handleOpenExpenseModal = () => {
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory('food');
    setIsExpenseModalOpen(true);
  };

  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) return;

    addExpense(trip.id, expenseCategory, amt, expenseTitle || 'Expense Log');
    setIsExpenseModalOpen(false);
  };

  const handleOpenEditBudgetModal = () => {
    setTargetBudgetInput(String(totalBudget));
    setIsEditBudgetModalOpen(true);
  };

  const handleSaveTargetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(targetBudgetInput);
    if (isNaN(amt) || amt < 0) return;

    updateTripBudget(trip.id, { totalBudget: amt, currency });
    setIsEditBudgetModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="var(--accent-cyan)" />
            Deterministic Budget & Expense Engine
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Calculations, category breakdowns, 10% emergency buffer, and remaining balances are computed deterministically.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={handleOpenEditBudgetModal}>
            Adjust Target Budget
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={handleOpenExpenseModal}>
            Log Expense
          </Button>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Total Target Budget Card */}
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Target Budget</span>
            <Wallet size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', marginTop: '6px' }}>
            ${totalBudget.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
          <span className="badge-trust badge-trust-user_entered" style={{ marginTop: '8px' }}>
            USER_ENTERED
          </span>
        </Card>

        {/* Estimated Total */}
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Estimated Total</span>
            <PieChart size={16} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-indigo)', marginTop: '6px' }}>
            ${estimatedTotal.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
          <span className="badge-trust badge-trust-estimated" style={{ marginTop: '8px' }}>
            ESTIMATED
          </span>
        </Card>

        {/* Actual Spent */}
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Actual Spent</span>
            <TrendingDown size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '6px' }}>
            ${actualSpent.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
          <span className="badge-trust badge-trust-user_entered" style={{ marginTop: '8px' }}>
            CALCULATED
          </span>
        </Card>

        {/* Remaining Budget */}
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Remaining Funds</span>
            <ShieldCheck size={16} color={remainingBudget >= 0 ? "var(--accent-emerald)" : "var(--accent-rose)"} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: remainingBudget >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', marginTop: '6px' }}>
            ${remainingBudget.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {remainingBudget >= 0 ? 'Within budget parameters' : '⚠️ Over target limit'}
          </div>
        </Card>

        {/* 10% Emergency Buffer Reserve */}
        <Card style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(18, 24, 36, 0.8) 100%)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>10% Emergency Buffer</span>
            <LifeBuoy size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', marginTop: '6px' }}>
            ${emergencyBuffer.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currency}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Reserved for unforeseen costs
          </div>
        </Card>
      </div>

      {/* 9 Category Allocation Breakdown Grid */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
              Category Breakdown & Allocations
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Detailed tracking across all 9 deterministic travel expense categories.
            </p>
          </div>
          <Badge variant="cyan">9 Categories Active</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {categories.map((cat) => {
            const spentPct = cat.allocatedAmount > 0 ? Math.min(100, Math.round((cat.spentAmount / cat.allocatedAmount) * 100)) : (cat.spentAmount > 0 ? 100 : 0);

            return (
              <div
                key={cat.category}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary, #1c1410)' }}>
                    {CATEGORY_ICONS[cat.category]}
                    {cat.name}
                  </div>
                  <span className={`badge-trust badge-trust-${cat.trustLabel.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                    {cat.trustLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spent: </span>
                    <strong style={{ fontSize: '1rem', color: cat.spentAmount > cat.allocatedAmount && cat.allocatedAmount > 0 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                      ${cat.spentAmount.toLocaleString()}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Allocated: ${cat.allocatedAmount.toLocaleString()} {currency}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${spentPct}%`,
                      height: '100%',
                      background: spentPct > 100 ? 'var(--accent-rose)' : 'linear-gradient(90deg, #06b6d4 0%, #10b981 100%)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Log Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Travel Expense">
        <form onSubmit={handleLogExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Expense Title / Description"
            value={expenseTitle}
            onChange={(e) => setExpenseTitle(e.target.value)}
            placeholder="e.g. Dinner at Le Jules Verne"
            required
          />

          <Input
            label={`Amount (${currency})`}
            type="number"
            step="0.01"
            min="0.01"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            placeholder="120.00"
            required
          />

          <Select
            label="Category"
            value={expenseCategory}
            onChange={(e) => setExpenseCategory(e.target.value as BudgetCategory)}
            options={ALL_CATEGORIES}
          />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Expense</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Target Budget Modal */}
      <Modal isOpen={isEditBudgetModalOpen} onClose={() => setIsEditBudgetModalOpen(false)} title="Adjust Target Budget">
        <form onSubmit={handleSaveTargetBudget} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label={`Target Trip Budget (${currency})`}
            type="number"
            step="1"
            min="0"
            value={targetBudgetInput}
            onChange={(e) => setTargetBudgetInput(e.target.value)}
            required
          />

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Updating the target budget will automatically recalculate remaining funds and the 10% emergency buffer reserve.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsEditBudgetModalOpen(false)}>Cancel</Button>
            <Button type="submit">Update Target Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


