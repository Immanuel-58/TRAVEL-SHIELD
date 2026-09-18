/**
 * CurrencyProvider
 * 
 * Multi-currency exchange rate and conversion service.
 * 
 * CORE RULES:
 * - Always preserve the original transaction amount and original currency.
 * - Converted values are calculated and stored separately.
 * - Explicitly label conversion status: LIVE, CACHED, ESTIMATED, USER_ENTERED, UNKNOWN.
 * - Never fabricate exchange rates. If rate is unavailable, report it clearly or allow manual entry.
 */

import { ExchangeRateSource } from '@/types/expense';

export interface ConversionResult {
  baseAmount: number;
  rate: number;
  source: ExchangeRateSource;
  isAvailable: boolean;
  disclaimer: string;
}

export interface ICurrencyProvider {
  getExchangeRate(from: string, to: string, manualRate?: number): ConversionResult;
  convert(amount: number, from: string, to: string, manualRate?: number): ConversionResult;
  getSupportedCurrencies(): Array<{ code: string; name: string; symbol: string }>;
}

// Benchmark rates against USD (cached baseline)
const BENCHMARK_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,    // 1 EUR = 1.08 USD
  GBP: 1.28,    // 1 GBP = 1.28 USD
  INR: 0.012,   // 1 INR = 0.012 USD (1 USD ~ 83.33 INR)
  JPY: 0.0065,  // 1 JPY = 0.0065 USD (1 USD ~ 153.8 JPY)
  CAD: 0.74,    // 1 CAD = 0.74 USD
  AUD: 0.66,    // 1 AUD = 0.66 USD
  SGD: 0.75,    // 1 SGD = 0.75 USD
  AED: 0.272,   // 1 AED = 0.272 USD (1 USD ~ 3.67 AED)
  CHF: 1.11,    // 1 CHF = 1.11 USD
  THB: 0.028,   // 1 THB = 0.028 USD (1 USD ~ 35.7 THB)
};

export const COMMON_CURRENCIES: Array<{ code: string; name: string; symbol: string }> = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'SG$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];

export class CurrencyProvider implements ICurrencyProvider {
  getSupportedCurrencies() {
    return COMMON_CURRENCIES;
  }

  getExchangeRate(from: string, to: string, manualRate?: number): ConversionResult {
    const fromCode = (from || 'USD').toUpperCase().trim();
    const toCode = (to || 'USD').toUpperCase().trim();

    // 1. Same currency: 1.0 parity
    if (fromCode === toCode) {
      return {
        baseAmount: 1.0,
        rate: 1.0,
        source: 'LIVE',
        isAvailable: true,
        disclaimer: 'Identical currency — 1:1 parity.',
      };
    }

    // 2. User-provided manual rate override
    if (typeof manualRate === 'number' && manualRate > 0) {
      return {
        baseAmount: manualRate,
        rate: manualRate,
        source: 'USER_ENTERED',
        isAvailable: true,
        disclaimer: `Manual exchange rate entered by traveler: 1 ${fromCode} = ${manualRate} ${toCode}.`,
      };
    }

    // 3. Known benchmark cached rates
    const fromToUsd = BENCHMARK_RATES_TO_USD[fromCode];
    const toToUsd = BENCHMARK_RATES_TO_USD[toCode];

    if (fromToUsd && toToUsd) {
      // 1 fromCode = fromToUsd USD; 1 toCode = toToUsd USD
      // rate = fromToUsd / toToUsd
      const rate = Number((fromToUsd / toToUsd).toFixed(6));
      return {
        baseAmount: rate,
        rate,
        source: 'CACHED',
        isAvailable: true,
        disclaimer: `Estimated cached conversion: 1 ${fromCode} ≈ ${rate} ${toCode}. Connect to update live market quotes.`,
      };
    }

    // 4. Unknown / Unsupported rate
    return {
      baseAmount: 1.0,
      rate: 1.0,
      source: 'UNKNOWN',
      isAvailable: false,
      disclaimer: `Exchange rate unavailable for ${fromCode} → ${toCode}. Please enter a manual rate.`,
    };
  }

  convert(amount: number, from: string, to: string, manualRate?: number): ConversionResult {
    const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const rateInfo = this.getExchangeRate(from, to, manualRate);

    if (!rateInfo.isAvailable && rateInfo.source === 'UNKNOWN') {
      return {
        ...rateInfo,
        baseAmount: num, // preserve raw number when conversion cannot be determined
      };
    }

    const baseAmount = Number((num * rateInfo.rate).toFixed(2));
    return {
      ...rateInfo,
      baseAmount,
    };
  }
}

export const currencyProvider = new CurrencyProvider();