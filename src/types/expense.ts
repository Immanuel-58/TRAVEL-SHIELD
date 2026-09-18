export type ExpenseCategory =
  | 'flights'
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'documents'
  | 'insurance'
  | 'other';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'mobile_payment'
  | 'other';

export type ExchangeRateSource = 'LIVE' | 'CACHED' | 'ESTIMATED' | 'USER_ENTERED' | 'UNKNOWN';

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  source: ExchangeRateSource;
  lastUpdated: string;
}

export interface Expense {
  id: string;
  tripId: string;
  amount: number;             // Original amount
  currency: string;           // Original currency (e.g. 'EUR', 'INR', 'USD')
  baseAmount: number;         // Converted amount in Trip base currency
  baseCurrency: string;       // Trip base currency
  exchangeRate?: number;      // Multiplier used: baseAmount = amount * exchangeRate
  rateSource: ExchangeRateSource;
  category: ExpenseCategory;
  description: string;
  merchant?: string;
  date: string;               // ISO 8601 or YYYY-MM-DD
  paymentMethod: PaymentMethod;
  receiptStorageKey?: string; // Key in localStorage for receipt image/data
  receiptName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface ExpenseInput {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  merchant?: string;
  date?: string;
  paymentMethod?: PaymentMethod;
  receiptDataUrl?: string;
  receiptName?: string;
  notes?: string;
  manualExchangeRate?: number;
}

export interface CategorySpending {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
}

export interface CurrencyBreakdownItem {
  currency: string;
  originalTotal: number;
  baseTotal: number;
  count: number;
}

export interface DailySpendingItem {
  date: string;
  amount: number;
  count: number;
}

export interface CashLeakageInsight {
  smallExpensesTotal: number;
  smallExpensesCount: number;
  smallExpensesPercentage: number;
  threshold: number;
  topSmallCategory: string;
  peakSpendDay?: {
    date: string;
    amount: number;
    category: string;
  };
  patterns: string[];
}

export interface ExpenseDashboardData {
  totalSpentBase: number;
  plannedBudget: number;
  remainingBudget: number;
  budgetUsedPercent: number;
  baseCurrency: string;
  categoryBreakdown: CategorySpending[];
  currencyBreakdown: CurrencyBreakdownItem[];
  dailySpend: DailySpendingItem[];
  largestExpenses: Expense[];
  cashLeakage: CashLeakageInsight;
}