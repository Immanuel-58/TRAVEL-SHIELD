'use client';

import React, { useState, useMemo } from 'react';
import { useTrip } from '@/context/TripContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Expense, ExpenseCategory, PaymentMethod, ExpenseInput } from '@/types/expense';
import { ExpenseService, EXPENSE_CATEGORIES } from '@/services/expense/ExpenseService';
import { currencyProvider } from '@/services/currency/CurrencyProvider';
import { receiptScanner } from '@/services/receipts/ReceiptScanner';
import { CameraCaptureModal } from '@/components/ui/CameraCaptureModal';
import { CameraSnapshotResult } from '@/services/device/CameraProvider';
import { 
  Plus, 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Filter, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Info, 
  ArrowRightLeft, 
  Sparkles,
  PieChart,
  CreditCard,
  Building2,
  Coffee,
  Plane,
  Camera,
  ShoppingBag,
  FileText,
  HeartPulse,
  HelpCircle,
  FileCheck
} from 'lucide-react';

const CATEGORY_ICONS: Record<ExpenseCategory, React.ReactNode> = {
  flights: <Plane size={16} />,
  accommodation: <Building2 size={16} />,
  food: <Coffee size={16} />,
  transport: <Plane size={16} />,
  activities: <Camera size={16} />,
  shopping: <ShoppingBag size={16} />,
  documents: <FileText size={16} />,
  insurance: <HeartPulse size={16} />,
  other: <HelpCircle size={16} />
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  flights: 'var(--accent-cyan)',
  accommodation: 'var(--accent-terracotta)',
  food: 'var(--accent-amber)',
  transport: '#0ea5e9',
  activities: 'var(--accent-emerald)',
  shopping: '#8b5cf6',
  documents: '#ec4899',
  insurance: '#06b6d4',
  other: 'var(--color-text-muted)'
};

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'AED', 'CHF', 'THB'];

interface ExpensesSectionProps {
  tripId: string;
}

export function ExpensesSection({ tripId }: ExpensesSectionProps) {
  const { trips, activeTrip, addTripExpense, updateTripExpense, deleteTripExpense } = useTrip();
  const currentTrip = trips.find(t => t.id === tripId) || activeTrip;

  // Filter and search state
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<string>('USD');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('food');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formMerchant, setFormMerchant] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [formManualRate, setFormManualRate] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReceiptFile, setFormReceiptFile] = useState<File | null>(null);
  const [isScanningReceipt, setIsScanningReceipt] = useState<boolean>(false);
  const [receiptScanResult, setReceiptScanResult] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const baseCurrency = currentTrip?.currency || 'USD';
  const totalBudget = currentTrip?.budget || currentTrip?.structuredBudget?.totalBudget || 0;
  const expenses = useMemo(() => currentTrip?.expenses || [], [currentTrip?.expenses]);

  // Sync default form currency when trip loads
  React.useEffect(() => {
    if (baseCurrency) {
      setFormCurrency(baseCurrency);
    }
  }, [baseCurrency]);

  // Compute analytics via ExpenseService
  const dashboardData = useMemo(() => {
    if (!currentTrip) {
      return {
        totalSpentBase: 0,
        plannedBudget: totalBudget,
        remainingBudget: totalBudget,
        budgetUsedPercent: 0,
        baseCurrency,
        categoryBreakdown: [],
        currencyBreakdown: [],
        dailySpend: [],
        largestExpenses: [],
        cashLeakage: {
          smallExpensesTotal: 0,
          smallExpensesCount: 0,
          smallExpensesPercentage: 0,
          threshold: 15,
          topSmallCategory: 'none',
          patterns: []
        }
      };
    }
    return ExpenseService.calculateDashboardData(currentTrip);
  }, [currentTrip, totalBudget, baseCurrency]);

  const cashLeakage = dashboardData.cashLeakage;

  // Live conversion preview in form
  const conversionPreview = useMemo(() => {
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) return null;
    const manualRateNum = formManualRate ? parseFloat(formManualRate) : undefined;
    return currencyProvider.convert(numAmount, formCurrency, baseCurrency, manualRateNum);
  }, [formAmount, formCurrency, baseCurrency, formManualRate]);

  // Filtered & sorted expense list
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }

    if (selectedPaymentMethod !== 'all') {
      result = result.filter(e => e.paymentMethod === selectedPaymentMethod);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.description.toLowerCase().includes(q) || 
        (e.merchant && e.merchant.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.baseAmount - a.baseAmount;
      if (sortBy === 'amount-asc') return a.baseAmount - b.baseAmount;
      return 0;
    });

    return result;
  }, [expenses, selectedCategory, selectedPaymentMethod, searchQuery, sortBy]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormAmount('');
    setFormCurrency(baseCurrency);
    setFormCategory('food');
    setFormDescription('');
    setFormMerchant('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('credit_card');
    setFormManualRate('');
    setFormNotes('');
    setFormReceiptFile(null);
    setReceiptScanResult(null);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormAmount(expense.amount.toString());
    setFormCurrency(expense.currency);
    setFormCategory(expense.category);
    setFormDescription(expense.description);
    setFormMerchant(expense.merchant || '');
    setFormDate(expense.date);
    setFormPaymentMethod(expense.paymentMethod);
    setFormManualRate(expense.rateSource === 'USER_ENTERED' && expense.exchangeRate ? expense.exchangeRate.toString() : '');
    setFormNotes(expense.notes || '');
    setFormReceiptFile(null);
    setReceiptScanResult(null);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormReceiptFile(file);
    setIsScanningReceipt(true);
    setReceiptScanResult(null);

    try {
      const parsed = receiptScanner.scanReceiptMetadata(file.name, formNotes);
      setIsScanningReceipt(false);

      if (parsed.suggestedAmount && !formAmount) {
        setFormAmount(parsed.suggestedAmount.toString());
      }
      if (parsed.suggestedCurrency) {
        setFormCurrency(parsed.suggestedCurrency);
      }
      if (parsed.suggestedDate) {
        setFormDate(parsed.suggestedDate);
      }
      if (parsed.suggestedMerchant && !formMerchant) {
        setFormMerchant(parsed.suggestedMerchant);
      }

      setReceiptScanResult(`Heuristic scan of "${file.name}": ${parsed.suggestedMerchant || 'Item'} (${parsed.rawConfidence} confidence). Please review values below.`);
    } catch {
      setIsScanningReceipt(false);
      setReceiptScanResult('Receipt file uploaded. Please confirm details manually.');
    }
  };

  const handleSaveExpense = async () => {
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Please enter a description or purpose for this expense.');
      return;
    }

    setFormError(null);

    const manualRateNum = formManualRate ? parseFloat(formManualRate) : undefined;
    const input: ExpenseInput = {
      amount: numAmount,
      currency: formCurrency,
      category: formCategory,
      description: formDescription.trim(),
      merchant: formMerchant.trim() || undefined,
      date: formDate,
      paymentMethod: formPaymentMethod,
      manualExchangeRate: manualRateNum,
      notes: formNotes.trim() || undefined,
      receiptName: formReceiptFile?.name || editingExpense?.receiptName
    };

    if (editingExpense) {
      updateTripExpense(tripId, editingExpense.id, {
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        description: input.description,
        merchant: input.merchant,
        date: input.date || editingExpense.date,
        paymentMethod: input.paymentMethod || editingExpense.paymentMethod,
        notes: input.notes,
        exchangeRate: input.manualExchangeRate,
        rateSource: input.manualExchangeRate ? 'USER_ENTERED' : editingExpense.rateSource
      });
    } else {
      addTripExpense(tripId, input);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    deleteTripExpense(tripId, id);
    setDeleteConfirmId(null);
  };

  const percentUsed = Math.min(100, Math.round(dashboardData.budgetUsedPercent));
  const isOverBudget = dashboardData.remainingBudget <= 0 && dashboardData.totalSpentBase > dashboardData.plannedBudget;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Expense Ledger & Multi-Currency
            </h1>
            <Badge variant="accent" style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff', fontSize: '0.75rem' }}>
              Base: {baseCurrency}
            </Badge>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginTop: '6px', margin: 0 }}>
            Record spending, track cross-currency conversions, reconcile cash leaks, and monitor budget pacing.
          </p>
        </div>

        <Button 
          variant="primary" 
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent-terracotta)' }}
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* KPI Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Total Budget */}
        <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Allocated Budget
            </span>
            <DollarSign size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {baseCurrency} {totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Target cap from Trip Budget plan
          </div>
        </Card>

        {/* Total Spent */}
        <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent-terracotta)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Spent
            </span>
            <TrendingUp size={20} color="var(--accent-terracotta)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {baseCurrency} {dashboardData.totalSpentBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {expenses.length} logged {expenses.length === 1 ? 'transaction' : 'transactions'}
          </div>
        </Card>

        {/* Remaining Budget */}
        <Card style={{ padding: '20px', borderLeft: `4px solid ${isOverBudget ? 'var(--accent-crimson)' : 'var(--accent-emerald)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Remaining
            </span>
            {isOverBudget ? <AlertCircle size={20} color="var(--accent-crimson)" /> : <TrendingDown size={20} color="var(--accent-emerald)" />}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isOverBudget ? 'var(--accent-crimson)' : 'var(--color-text-primary)' }}>
            {baseCurrency} {Math.abs(dashboardData.remainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {isOverBudget && <span style={{ fontSize: '0.9rem', marginLeft: '6px', fontWeight: 600 }}>OVER</span>}
          </div>
          <div style={{ fontSize: '0.82rem', color: isOverBudget ? 'var(--accent-crimson)' : 'var(--color-text-muted)', marginTop: '4px' }}>
            {isOverBudget ? 'Spending exceeds target limit' : `${(100 - percentUsed).toFixed(0)}% funds remaining`}
          </div>
        </Card>

        {/* Budget Usage Pace */}
        <Card style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pace / Utilization
            </span>
            <PieChart size={20} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
            {percentUsed}%
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${percentUsed}%`, 
                height: '100%', 
                backgroundColor: isOverBudget ? 'var(--accent-crimson)' : percentUsed > 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                borderRadius: '4px' 
              }} 
            />
          </div>
        </Card>
      </div>

      {/* Category Breakdown & Cash Leakage Reconciler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Category Breakdown Card */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieChart size={20} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Category Breakdown
            </h2>
          </div>

          {dashboardData.categoryBreakdown.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No expenses recorded yet. Add your first expense to see category spending.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dashboardData.categoryBreakdown.map(cat => (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      <span style={{ color: CATEGORY_COLORS[cat.category as ExpenseCategory] || 'var(--accent-terracotta)' }}>
                        {CATEGORY_ICONS[cat.category as ExpenseCategory] || <HelpCircle size={16} />}
                      </span>
                      <span>{cat.category}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>({cat.count})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {baseCurrency} {cat.amount.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', minWidth: '40px', textAlign: 'right' }}>
                        {cat.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, cat.percentage)}%`, 
                        height: '100%', 
                        backgroundColor: CATEGORY_COLORS[cat.category as ExpenseCategory] || 'var(--accent-terracotta)',
                        borderRadius: '3px' 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Cash Leakage Reconciler Card */}
        <Card style={{ padding: '24px', backgroundColor: cashLeakage.smallExpensesCount > 0 ? '#fffdf7' : 'var(--color-bg-surface)', border: cashLeakage.smallExpensesCount > 0 ? '1px solid #fde68a' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={20} color="var(--accent-amber)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Cash Leakage Reconciler
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', backgroundColor: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Small Purchases (&lt; {cashLeakage.threshold} {baseCurrency})</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{cashLeakage.smallExpensesCount} items</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Micro-Spend</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{baseCurrency} {cashLeakage.smallExpensesTotal.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Primary Micro-Category</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>{cashLeakage.topSmallCategory}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cashLeakage.patterns.length > 0 ? (
              cashLeakage.patterns.map((pat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: 'var(--color-text-secondary)', backgroundColor: '#fff', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{pat}</span>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <FileCheck size={18} color="var(--accent-emerald)" />
                <span>No unaccounted micro-purchases detected. Spending remains transparent.</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Filter and Search Toolbar */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search merchant or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--color-text-muted)" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.88rem'
              }}
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select 
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.88rem'
              }}
            >
              <option value="all">All Payment Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="cash">Cash</option>
              <option value="mobile_payment">Mobile Payment</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.88rem'
              }}
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Expenses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredExpenses.length === 0 ? (
          <Card style={{ padding: '40px' }}>
            <EmptyState 
              icon={<Receipt size={36} color="var(--accent-terracotta)" />}
              title={expenses.length === 0 ? "No Expenses Recorded Yet" : "No Matching Expenses Found"}
              description={expenses.length === 0 ? "Start logging your travel expenditures to track spending against your trip budget." : "Try adjusting your search query or filters to find what you need."}
              actionLabel={expenses.length === 0 ? "Log First Expense" : undefined}
              onAction={expenses.length === 0 ? handleOpenAdd : undefined}
            />
          </Card>
        ) : (
          filteredExpenses.map((expense) => {
            const isForeign = expense.currency !== baseCurrency;

            return (
              <Card key={expense.id} style={{ padding: '16px 20px', transition: 'box-shadow 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Left Column: Details */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 300px' }}>
                    <div style={{ 
                      backgroundColor: 'var(--color-bg-secondary)', 
                      padding: '10px', 
                      borderRadius: '10px', 
                      color: CATEGORY_COLORS[expense.category as ExpenseCategory] || 'var(--accent-terracotta)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {CATEGORY_ICONS[expense.category as ExpenseCategory] || <HelpCircle size={16} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {expense.description}
                        </span>
                        {expense.merchant && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            @ {expense.merchant}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} />
                          {expense.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                          <CreditCard size={13} />
                          {expense.paymentMethod.replace('_', ' ')}
                        </span>
                        <Badge variant="neutral" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                          {expense.category}
                        </Badge>
                        {(expense.receiptName || expense.receiptStorageKey) && (
                          <Badge variant="accent" style={{ fontSize: '0.72rem', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                            <FileCheck size={11} style={{ marginRight: '3px' }} />
                            Receipt attached
                          </Badge>
                        )}
                      </div>

                      {expense.notes && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                          "{expense.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Actions */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ textAlign: 'right' }}>
                      {/* Base converted amount */}
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        {baseCurrency} {expense.baseAmount.toFixed(2)}
                      </div>

                      {/* Foreign currency original if applicable */}
                      {isForeign && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          <span>Original: {expense.currency} {expense.amount.toFixed(2)}</span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                            ({(expense.rateSource || 'cached').toLowerCase()})
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenEdit(expense)}
                        style={{ padding: '6px 10px', height: 'auto', color: 'var(--color-text-secondary)' }}
                        title="Edit expense"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeleteConfirmId(expense.id)}
                        style={{ padding: '6px 10px', height: 'auto', color: 'var(--accent-crimson)' }}
                        title="Delete expense"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation In-Place */}
                {deleteConfirmId === expense.id && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-crimson)', fontWeight: 600 }}>
                      Permanently delete this expense?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        style={{ backgroundColor: 'var(--accent-crimson)', color: '#ffffff' }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title={editingExpense ? "Edit Expense Record" : "Log New Travel Expense"}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
          {formError && (
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          {/* Receipt Upload & Heuristic Scan */}
          <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '14px', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} color="var(--accent-terracotta)" />
                Attach Receipt & Auto-Fill (Optional)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Local heuristic scan</span>
            </div>
            <input 
              type="file" 
              accept="image/*,.pdf,.txt"
              onChange={handleReceiptUpload}
              style={{ fontSize: '0.82rem', width: '100%', color: 'var(--color-text-secondary)' }}
            />
            {isScanningReceipt && (
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '6px' }}>
                Parsing receipt metadata locally...
              </div>
            )}
            {receiptScanResult && (
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', marginTop: '6px', fontWeight: 500 }}>
                {receiptScanResult}
              </div>
            )}
            <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
              Local heuristic parser. Does not claim optical character recognition (OCR). Always verify extracted fields.
            </div>
          </div>

          {/* Amount and Currency Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Amount *
              </label>
              <input 
                type="number" 
                step="0.01" 
                min="0.01"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Currency *
              </label>
              <select 
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {COMMON_CURRENCIES.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Currency Conversion Transparency Callout */}
          {conversionPreview && formCurrency !== baseCurrency && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 600 }}>
                <ArrowRightLeft size={14} />
                <span>Conversion to Trip Base ({baseCurrency}):</span>
                <span style={{ fontSize: '0.95rem' }}>≈ {baseCurrency} {conversionPreview.baseAmount.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#15803d', marginTop: '4px' }}>
                Rate Source: <strong>{conversionPreview.source}</strong> (1 {formCurrency} = {conversionPreview.rate.toFixed(4)} {baseCurrency})
              </div>
            </div>
          )}

          {/* Manual Exchange Rate Override (Optional) */}
          {formCurrency !== baseCurrency && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Manual Exchange Rate Override (Optional)
              </label>
              <input 
                type="number" 
                step="0.0001"
                placeholder={`e.g., actual rate ${conversionPreview?.rate ? conversionPreview.rate.toFixed(4) : ''}`}
                value={formManualRate}
                onChange={(e) => setFormManualRate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              />
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                Leave empty to use verified benchmark rate.
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Description / Item *
            </label>
            <input 
              type="text" 
              placeholder="e.g. Louvre admission ticket, Dinner at Le Bistro..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Merchant & Category Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Merchant / Payee
              </label>
              <input 
                type="text" 
                placeholder="e.g. Starbucks, SNCF..."
                value={formMerchant}
                onChange={(e) => setFormMerchant(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Category *
              </label>
              <select 
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              >
                {EXPENSE_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Date *
              </label>
              <input 
                type="date" 
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Payment Method *
              </label>
              <select 
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.88rem'
                }}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash</option>
                <option value="mobile_payment">Mobile Payment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Notes / Tags (Optional)
            </label>
            <input 
              type="text" 
              placeholder="e.g. Split with John, Tax deductible..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveExpense}
              style={{ backgroundColor: 'var(--accent-terracotta)', color: '#ffffff' }}
            >
              {editingExpense ? "Update Expense" : "Save Expense"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
