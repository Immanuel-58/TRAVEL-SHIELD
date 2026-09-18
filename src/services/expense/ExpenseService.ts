/**
 * ExpenseService
 * 
 * Deterministic calculation engine for trip expense analytics,
 * budget integration, multi-currency consolidation, and the
 * Cash Leakage Reconciler.
 */

import { Trip } from '@/types/trip';
import {
  Expense,
  ExpenseInput,
  ExpenseDashboardData,
  CategorySpending,
  CurrencyBreakdownItem,
  DailySpendingItem,
  CashLeakageInsight,
  ExpenseCategory,
} from '@/types/expense';
import { currencyProvider } from '@/services/currency/CurrencyProvider';

export const EXPENSE_CATEGORIES: Array<{ id: ExpenseCategory; label: string; icon: string }> = [
  { id: 'flights', label: 'Flights & Aviation', icon: 'Plane' },
  { id: 'accommodation', label: 'Accommodation', icon: 'Hotel' },
  { id: 'food', label: 'Food & Dining', icon: 'Utensils' },
  { id: 'transport', label: 'Local Transport', icon: 'Car' },
  { id: 'activities', label: 'Activities & Sightseeing', icon: 'Compass' },
  { id: 'shopping', label: 'Shopping & Souvenirs', icon: 'ShoppingBag' },
  { id: 'documents', label: 'Visa & Travel Docs', icon: 'FileText' },
  { id: 'insurance', label: 'Travel Insurance', icon: 'Shield' },
  { id: 'other', label: 'Other & Miscellaneous', icon: 'Receipt' },
];

export class ExpenseService {
  /**
   * Creates a normalized Expense object from user input.
   * Concurrently computes baseCurrency conversion without altering raw amount/currency.
   */
  static createExpenseRecord(trip: Trip, input: ExpenseInput): Expense {
    const baseCurrency = trip.currency || 'USD';
    const originalCurrency = (input.currency || baseCurrency).toUpperCase().trim();
    const amount = Number(Number(input.amount || 0).toFixed(2));

    const conversion = currencyProvider.convert(
      amount,
      originalCurrency,
      baseCurrency,
      input.manualExchangeRate
    );

    const now = new Date().toISOString();

    return {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tripId: trip.id,
      amount,
      currency: originalCurrency,
      baseAmount: conversion.baseAmount,
      baseCurrency,
      exchangeRate: conversion.rate,
      rateSource: conversion.source,
      category: input.category || 'other',
      description: input.description.trim() || 'Trip Expense',
      merchant: input.merchant?.trim() || undefined,
      date: input.date || now.split('T')[0],
      paymentMethod: input.paymentMethod || 'credit_card',
      receiptStorageKey: input.receiptDataUrl ? `travelshield_receipt_${Date.now()}` : undefined,
      receiptName: input.receiptName,
      notes: input.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'synced',
    };
  }

  /**
   * Deterministically computes complete dashboard analytics across trip expenses.
   */
  static calculateDashboardData(trip: Trip): ExpenseDashboardData {
    const expenses = trip.expenses || [];
    const baseCurrency = trip.currency || 'USD';
    const plannedBudget = trip.budget || 0;

    // 1. Total spent in trip base currency
    const totalSpentBase = Number(
      expenses.reduce((sum, exp) => sum + (exp.baseAmount || 0), 0).toFixed(2)
    );

    // 2. Remaining budget
    const remainingBudget = Number(Math.max(0, plannedBudget - totalSpentBase).toFixed(2));
    const budgetUsedPercent = plannedBudget > 0
      ? Number(((totalSpentBase / plannedBudget) * 100).toFixed(1))
      : 0;

    // 3. Category Breakdown
    const catMap = new Map<ExpenseCategory, { amount: number; count: number }>();
    for (const exp of expenses) {
      const existing = catMap.get(exp.category) || { amount: 0, count: 0 };
      catMap.set(exp.category, {
        amount: Number((existing.amount + (exp.baseAmount || 0)).toFixed(2)),
        count: existing.count + 1,
      });
    }

    const categoryBreakdown: CategorySpending[] = EXPENSE_CATEGORIES.map(cat => {
      const stats = catMap.get(cat.id) || { amount: 0, count: 0 };
      return {
        category: cat.id,
        amount: stats.amount,
        percentage: totalSpentBase > 0 ? Number(((stats.amount / totalSpentBase) * 100).toFixed(1)) : 0,
        count: stats.count,
      };
    }).filter(c => c.count > 0 || c.amount > 0);

    // 4. Currency Breakdown
    const currMap = new Map<string, { originalTotal: number; baseTotal: number; count: number }>();
    for (const exp of expenses) {
      const existing = currMap.get(exp.currency) || { originalTotal: 0, baseTotal: 0, count: 0 };
      currMap.set(exp.currency, {
        originalTotal: Number((existing.originalTotal + exp.amount).toFixed(2)),
        baseTotal: Number((existing.baseTotal + (exp.baseAmount || 0)).toFixed(2)),
        count: existing.count + 1,
      });
    }

    const currencyBreakdown: CurrencyBreakdownItem[] = Array.from(currMap.entries()).map(
      ([curr, stats]) => ({
        currency: curr,
        originalTotal: stats.originalTotal,
        baseTotal: stats.baseTotal,
        count: stats.count,
      })
    );

    // 5. Daily Spending
    const dayMap = new Map<string, { amount: number; count: number }>();
    for (const exp of expenses) {
      const day = exp.date ? exp.date.split('T')[0] : 'Unspecified';
      const existing = dayMap.get(day) || { amount: 0, count: 0 };
      dayMap.set(day, {
        amount: Number((existing.amount + (exp.baseAmount || 0)).toFixed(2)),
        count: existing.count + 1,
      });
    }

    const dailySpend: DailySpendingItem[] = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, stats]) => ({
        date,
        amount: stats.amount,
        count: stats.count,
      }));

    // 6. Largest Expenses
    const largestExpenses = [...expenses]
      .sort((a, b) => (b.baseAmount || 0) - (a.baseAmount || 0))
      .slice(0, 5);

    // 7. Cash Leakage Reconciler
    const cashLeakage = this.analyzeCashLeakage(expenses, totalSpentBase, baseCurrency);

    return {
      totalSpentBase,
      plannedBudget,
      remainingBudget,
      budgetUsedPercent,
      baseCurrency,
      categoryBreakdown,
      currencyBreakdown,
      dailySpend,
      largestExpenses,
      cashLeakage,
    };
  }

  /**
   * Cash Leakage Reconciler:
   * Analyzes repeated small expenses and uncovers objective spending patterns.
   */
  static analyzeCashLeakage(
    expenses: Expense[],
    totalSpentBase: number,
    baseCurrency: string,
    threshold = 15
  ): CashLeakageInsight {
    if (expenses.length === 0) {
      return {
        smallExpensesTotal: 0,
        smallExpensesCount: 0,
        smallExpensesPercentage: 0,
        threshold,
        topSmallCategory: 'none',
        patterns: ['No expenses logged yet. Add your first expense to activate pattern analysis.'],
      };
    }

    // Filter small expenses under the threshold in base currency
    const smallExpenses = expenses.filter(e => (e.baseAmount || 0) <= threshold);
    const smallExpensesTotal = Number(
      smallExpenses.reduce((sum, e) => sum + (e.baseAmount || 0), 0).toFixed(2)
    );
    const smallExpensesCount = smallExpenses.length;
    const smallExpensesPercentage = totalSpentBase > 0
      ? Number(((smallExpensesTotal / totalSpentBase) * 100).toFixed(1))
      : 0;

    // Small category distribution
    const smallCatCount: Record<string, number> = {};
    smallExpenses.forEach(e => {
      smallCatCount[e.category] = (smallCatCount[e.category] || 0) + 1;
    });

    let topSmallCategory = 'miscellaneous';
    let maxSmallCatCount = 0;
    for (const [cat, cnt] of Object.entries(smallCatCount)) {
      if (cnt > maxSmallCatCount) {
        maxSmallCatCount = cnt;
        topSmallCategory = cat;
      }
    }

    // Peak spending day analysis
    const dayTotals: Record<string, { amount: number; categoryTotals: Record<string, number> }> = {};
    expenses.forEach(e => {
      const d = e.date ? e.date.split('T')[0] : 'Unspecified';
      if (!dayTotals[d]) {
        dayTotals[d] = { amount: 0, categoryTotals: {} };
      }
      dayTotals[d].amount += (e.baseAmount || 0);
      dayTotals[d].categoryTotals[e.category] = (dayTotals[d].categoryTotals[e.category] || 0) + (e.baseAmount || 0);
    });

    let peakDay: { date: string; amount: number; category: string } | undefined;
    let maxDaySpend = 0;
    for (const [date, data] of Object.entries(dayTotals)) {
      if (data.amount > maxDaySpend) {
        maxDaySpend = data.amount;
        let topCat = 'general';
        let topCatAmt = 0;
        for (const [cat, amt] of Object.entries(data.categoryTotals)) {
          if (amt > topCatAmt) {
            topCatAmt = amt;
            topCat = cat;
          }
        }
        peakDay = {
          date,
          amount: Number(data.amount.toFixed(2)),
          category: topCat,
        };
      }
    }

    // Payment method pattern
    const paymentMethods: Record<string, number> = {};
    expenses.forEach(e => {
      paymentMethods[e.paymentMethod] = (paymentMethods[e.paymentMethod] || 0) + 1;
    });
    const cashCount = paymentMethods['cash'] || 0;
    const cashPct = Math.round((cashCount / expenses.length) * 100);

    // Formulate factual patterns
    const patterns: string[] = [];

    if (smallExpensesCount > 0) {
      patterns.push(
        `Small purchases under ${threshold} ${baseCurrency} account for ${smallExpensesPercentage}% of total recorded spending (${smallExpensesCount} purchases totaling ${smallExpensesTotal.toLocaleString()} ${baseCurrency}).`
      );
      if (topSmallCategory !== 'none') {
        patterns.push(
          `Frequent low-value transactions concentrated heavily in ${topSmallCategory.toUpperCase()} (${maxSmallCatCount} occurrences).`
        );
      }
    }

    if (peakDay) {
      patterns.push(
        `Peak single-day spending occurred on ${peakDay.date} with ${peakDay.amount.toLocaleString()} ${baseCurrency} logged, primarily driven by ${peakDay.category.toUpperCase()}.`
      );
    }

    if (cashCount > 0) {
      patterns.push(
        `${cashPct}% of logged transactions (${cashCount} items) were completed using physical cash.`
      );
    }

    return {
      smallExpensesTotal,
      smallExpensesCount,
      smallExpensesPercentage,
      threshold,
      topSmallCategory,
      peakSpendDay: peakDay,
      patterns,
    };
  }
}