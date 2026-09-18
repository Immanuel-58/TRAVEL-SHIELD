import { describe, it } from 'node:test';
import assert from 'node:assert';
import { currencyProvider } from '../services/currency/CurrencyProvider';
import { ExpenseService } from '../services/expense/ExpenseService';
import { receiptScanner } from '../services/receipts/ReceiptScanner';
import { Expense, ExpenseInput } from '../types/expense';
import { SyncQueueService } from '../services/offline/SyncQueueService';
import { localAIProvider } from '../services/ai/LocalAIProvider';
import { Trip } from '../types/trip';

describe('Phase 10 — CurrencyProvider & Multi-Currency Engine', () => {
  it('handles same-currency conversions with rate 1.0 and LIVE status', () => {
    const result = currencyProvider.convert(100, 'USD', 'USD');
    assert.strictEqual(result.baseAmount, 100);
    assert.strictEqual(result.rate, 1.0);
    assert.strictEqual(result.source, 'LIVE');
  });

  it('converts between known benchmark currencies using CACHED rates', () => {
    // USD to EUR benchmark
    const result = currencyProvider.convert(100, 'USD', 'EUR');
    assert.strictEqual(result.source, 'CACHED');
    assert.ok(result.rate > 0.8 && result.rate < 1.1);
    assert.strictEqual(result.baseAmount, Number((100 * result.rate).toFixed(2)));

    // EUR to USD inverse conversion
    const inverse = currencyProvider.convert(92, 'EUR', 'USD');
    assert.strictEqual(inverse.source, 'CACHED');
    assert.ok(inverse.rate > 0.9 && inverse.rate < 1.2);
  });

  it('respects user-entered manual exchange rate override', () => {
    const manualRate = 0.85;
    const result = currencyProvider.convert(200, 'EUR', 'USD', manualRate);
    assert.strictEqual(result.source, 'USER_ENTERED');
    assert.strictEqual(result.rate, 0.85);
    assert.strictEqual(result.baseAmount, 170);
  });

  it('handles unknown currencies gracefully without fabricating rates', () => {
    const result = currencyProvider.convert(100, 'XYZ', 'USD');
    assert.strictEqual(result.source, 'UNKNOWN');
    assert.strictEqual(result.rate, 1.0);
    assert.strictEqual(result.baseAmount, 100);
  });
});

describe('Phase 10 — ExpenseService & Financial Ledger', () => {
  const mockTrip: Trip = {
    id: 'trip-p10-test',
    name: 'Tokyo Expedition',
    origin: 'New York',
    destination: 'Tokyo, Japan',
    startDate: '2026-06-15',
    endDate: '2026-06-25',
    travelers: 2,
    budget: 3000,
    currency: 'USD',
    travelStyle: 'moderate',
    interests: ['culture'],
    status: 'active',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    expenses: []
  };

  it('creates an immutable expense record preserving original currency and converted base amount', () => {
    const input: ExpenseInput = {
      amount: 1500,
      currency: 'JPY',
      category: 'food',
      description: 'Ramen lunch in Shinjuku',
      merchant: 'Ichiran Ramen',
      date: '2026-06-15',
      paymentMethod: 'cash'
    };

    const record = ExpenseService.createExpenseRecord(mockTrip, input);
    assert.ok(record.id.startsWith('exp_'));
    assert.strictEqual(record.tripId, mockTrip.id);
    assert.strictEqual(record.amount, 1500);
    assert.strictEqual(record.currency, 'JPY');
    assert.strictEqual(record.baseCurrency, 'USD');
    assert.ok(record.baseAmount > 0);
    assert.ok(record.exchangeRate && record.exchangeRate > 0);
    assert.strictEqual(record.rateSource, 'CACHED');
  });

  it('computes dashboard metrics and category breakdown accurately', () => {
    const tripWithExpenses: Trip = {
      ...mockTrip,
      budget: 500,
      expenses: [
        {
          id: 'exp_1',
          tripId: mockTrip.id,
          amount: 50,
          currency: 'USD',
          baseAmount: 50,
          baseCurrency: 'USD',
          exchangeRate: 1.0,
          rateSource: 'LIVE',
          category: 'food',
          description: 'Breakfast',
          date: '2026-06-15',
          paymentMethod: 'credit_card',
          createdAt: '2026-06-15T08:00:00Z',
          updatedAt: '2026-06-15T08:00:00Z'
        },
        {
          id: 'exp_2',
          tripId: mockTrip.id,
          amount: 100,
          currency: 'USD',
          baseAmount: 100,
          baseCurrency: 'USD',
          exchangeRate: 1.0,
          rateSource: 'LIVE',
          category: 'activities',
          description: 'Museum pass',
          date: '2026-06-15',
          paymentMethod: 'credit_card',
          createdAt: '2026-06-15T10:00:00Z',
          updatedAt: '2026-06-15T10:00:00Z'
        }
      ]
    };

    const dashboard = ExpenseService.calculateDashboardData(tripWithExpenses);
    assert.strictEqual(dashboard.totalSpentBase, 150);
    assert.strictEqual(dashboard.plannedBudget, 500);
    assert.strictEqual(dashboard.remainingBudget, 350);
    assert.strictEqual(dashboard.budgetUsedPercent, 30);
    assert.strictEqual(dashboard.categoryBreakdown.length, 2);

    const foodCat = dashboard.categoryBreakdown.find(c => c.category === 'food');
    assert.ok(foodCat);
    assert.strictEqual(foodCat.amount, 50);
    assert.strictEqual(foodCat.percentage, Number(((50 / 150) * 100).toFixed(1)));
  });

  it('handles empty expense records gracefully without NaN', () => {
    const dashboard = ExpenseService.calculateDashboardData(mockTrip);
    assert.strictEqual(dashboard.totalSpentBase, 0);
    assert.strictEqual(dashboard.remainingBudget, 3000);
    assert.strictEqual(dashboard.budgetUsedPercent, 0);
    assert.strictEqual(dashboard.categoryBreakdown.length, 0);
    assert.strictEqual(dashboard.largestExpenses.length, 0);
  });

  it('flags zero remaining budget and 120% used when spending exceeds total budget', () => {
    const overTrip: Trip = {
      ...mockTrip,
      budget: 1000,
      expenses: [
        {
          id: 'exp_over',
          tripId: mockTrip.id,
          amount: 1200,
          currency: 'USD',
          baseAmount: 1200,
          baseCurrency: 'USD',
          exchangeRate: 1.0,
          rateSource: 'LIVE',
          category: 'accommodation',
          description: 'Hotel suite',
          date: '2026-06-15',
          paymentMethod: 'credit_card',
          createdAt: '2026-06-15T12:00:00Z',
          updatedAt: '2026-06-15T12:00:00Z'
        }
      ]
    };

    const dashboard = ExpenseService.calculateDashboardData(overTrip);
    assert.strictEqual(dashboard.totalSpentBase, 1200);
    assert.strictEqual(dashboard.remainingBudget, 0);
    assert.strictEqual(dashboard.budgetUsedPercent, 120);
  });
});

describe('Phase 10 — Cash Leakage Reconciler', () => {
  it('identifies repeated micro-purchases under $15 without subjective judgment', () => {
    const expenses: Expense[] = [
      {
        id: 'c1',
        tripId: 't1',
        amount: 4.5,
        currency: 'USD',
        baseAmount: 4.5,
        baseCurrency: 'USD',
        exchangeRate: 1.0,
        rateSource: 'LIVE',
        category: 'food',
        description: 'Espresso',
        date: '2026-06-15',
        paymentMethod: 'cash',
        createdAt: '2026-06-15T09:00:00Z',
        updatedAt: '2026-06-15T09:00:00Z'
      },
      {
        id: 'c2',
        tripId: 't1',
        amount: 6.0,
        currency: 'USD',
        baseAmount: 6.0,
        baseCurrency: 'USD',
        exchangeRate: 1.0,
        rateSource: 'LIVE',
        category: 'food',
        description: 'Pastry',
        date: '2026-06-15',
        paymentMethod: 'cash',
        createdAt: '2026-06-15T10:30:00Z',
        updatedAt: '2026-06-15T10:30:00Z'
      },
      {
        id: 'c3',
        tripId: 't1',
        amount: 8.5,
        currency: 'USD',
        baseAmount: 8.5,
        baseCurrency: 'USD',
        exchangeRate: 1.0,
        rateSource: 'LIVE',
        category: 'food',
        description: 'Gelato',
        date: '2026-06-15',
        paymentMethod: 'cash',
        createdAt: '2026-06-15T15:00:00Z',
        updatedAt: '2026-06-15T15:00:00Z'
      }
    ];

    const result = ExpenseService.analyzeCashLeakage(expenses, 19, 'USD', 15);
    assert.strictEqual(result.smallExpensesCount, 3);
    assert.strictEqual(result.smallExpensesTotal, 19);
    assert.strictEqual(result.topSmallCategory, 'food');
    assert.ok(result.patterns.length > 0);
    assert.ok(result.patterns[0].includes('Small purchases under 15 USD'));
  });

  it('returns clean observation when no micro-purchases exist', () => {
    const expenses: Expense[] = [
      {
        id: 'c1',
        tripId: 't1',
        amount: 250,
        currency: 'USD',
        baseAmount: 250,
        baseCurrency: 'USD',
        exchangeRate: 1.0,
        rateSource: 'LIVE',
        category: 'accommodation',
        description: 'Hotel room',
        date: '2026-06-15',
        paymentMethod: 'credit_card',
        createdAt: '2026-06-15T09:00:00Z',
        updatedAt: '2026-06-15T09:00:00Z'
      }
    ];

    const result = ExpenseService.analyzeCashLeakage(expenses, 250, 'USD', 15);
    assert.strictEqual(result.smallExpensesCount, 0);
    assert.strictEqual(result.smallExpensesTotal, 0);
  });
});

describe('Phase 10 — ReceiptScanner Abstraction', () => {
  it('extracts metadata from filename heuristics and provides truthful disclaimer', () => {
    const filename = 'starbucks_coffee_15.50_eur_2026-06-12.jpg';
    const parsed = receiptScanner.scanReceiptMetadata(filename);

    assert.strictEqual(parsed.suggestedAmount, 15.5);
    assert.strictEqual(parsed.suggestedCurrency, 'EUR');
    assert.ok(parsed.disclaimer.includes('No external OCR cloud servers used'));
    assert.ok(parsed.rawConfidence === 'medium' || parsed.rawConfidence === 'low');
  });
});

describe('Phase 10 — Offline Sync & AI Assistant Integration', () => {
  const baseTrip: Trip = {
    id: 'trip-offline-exp',
    name: 'Tokyo Expedition',
    origin: 'New York',
    destination: 'Tokyo, Japan',
    startDate: '2026-10-01',
    endDate: '2026-10-10',
    travelers: 2,
    budget: 3000,
    currency: 'USD',
    travelStyle: 'moderate',
    interests: ['food'],
    status: 'active',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    expenses: []
  };

  it('applies an offline ADD_EXPENSE action locally and updates budget spent', () => {
    const newExpense: Expense = {
      id: 'exp_offline_1',
      tripId: baseTrip.id,
      amount: 45,
      currency: 'USD',
      baseAmount: 45,
      baseCurrency: 'USD',
      exchangeRate: 1.0,
      rateSource: 'LIVE',
      category: 'food',
      description: 'Tempura dinner',
      date: '2026-10-02',
      paymentMethod: 'credit_card',
      createdAt: '2026-10-02T19:00:00Z',
      updatedAt: '2026-10-02T19:00:00Z'
    };

    const res = SyncQueueService.applyLocally(baseTrip, {
      id: 'sync_1',
      tripId: baseTrip.id,
      actionType: 'ADD_EXPENSE',
      payload: { expense: newExpense },
      createdAt: '2026-10-02T19:00:00Z',
      status: 'pending',
      retryCount: 0
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.trip.expenses?.length, 1);
    assert.strictEqual(res.trip.expensesSummary?.totalSpent, 45);
  });

  it('applies an offline DELETE_EXPENSE action locally and recalculates budget spent', () => {
    const tripWithExp: Trip = {
      ...baseTrip,
      expenses: [
        {
          id: 'exp_to_delete',
          tripId: baseTrip.id,
          amount: 75,
          currency: 'USD',
          baseAmount: 75,
          baseCurrency: 'USD',
          exchangeRate: 1.0,
          rateSource: 'LIVE',
          category: 'transport',
          description: 'Bullet train',
          date: '2026-10-03',
          paymentMethod: 'credit_card',
          createdAt: '2026-10-03T10:00:00Z',
          updatedAt: '2026-10-03T10:00:00Z'
        }
      ]
    };

    const res = SyncQueueService.applyLocally(tripWithExp, {
      id: 'sync_2',
      tripId: baseTrip.id,
      actionType: 'DELETE_EXPENSE',
      payload: { expenseId: 'exp_to_delete' },
      createdAt: '2026-10-03T10:00:00Z',
      status: 'pending',
      retryCount: 0
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.trip.expenses?.length, 0);
    assert.strictEqual(res.trip.expensesSummary?.totalSpent, 0);
  });

  it('local AI provider responds deterministically to expense spending queries offline', async () => {
    const tripWithExpenses: Trip = {
      ...baseTrip,
      budget: 2000,
      currency: 'USD',
      expenses: [
        {
          id: 'exp_ai_test',
          tripId: baseTrip.id,
          amount: 150,
          currency: 'USD',
          baseAmount: 150,
          baseCurrency: 'USD',
          exchangeRate: 1.0,
          rateSource: 'LIVE',
          category: 'food',
          description: 'Sushi dinner',
          merchant: 'Sukiyabashi',
          date: '2026-10-02',
          paymentMethod: 'credit_card',
          createdAt: '2026-10-02T20:00:00Z',
          updatedAt: '2026-10-02T20:00:00Z'
        }
      ]
    };

    const result = await localAIProvider.sendMessage(
      [{ id: 'msg_1', role: 'user', content: 'Show my trip expenses and spending so far', timestamp: new Date().toISOString() }],
      tripWithExpenses as any
    );

    assert.ok(result.message.includes('Sushi dinner'));
    assert.ok(result.message.includes('Total Spent:'));
    assert.ok(result.message.includes('150'));
    assert.ok(result.message.includes('Remaining Budget:'));
  });
});
