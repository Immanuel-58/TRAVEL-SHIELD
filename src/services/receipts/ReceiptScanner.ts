/**
 * ReceiptScanner
 * 
 * Local receipt processing abstraction.
 * 
 * CORE RULES:
 * - DO NOT fake OCR or computer vision.
 * - Extracts candidate fields from filename heuristics and user notes.
 * - ALWAYS requires manual user review before saving.
 */

export interface ParsedReceiptData {
  suggestedMerchant?: string;
  suggestedAmount?: number;
  suggestedCurrency?: string;
  suggestedDate?: string;
  rawConfidence: 'low' | 'medium';
  disclaimer: string;
}

export interface IReceiptScanner {
  scanReceiptMetadata(filename: string, userNotes?: string): ParsedReceiptData;
}

export class HeuristicReceiptScanner implements IReceiptScanner {
  scanReceiptMetadata(filename: string, userNotes = ''): ParsedReceiptData {
    const text = `${filename} ${userNotes}`.toLowerCase();

    // 1. Currency detection
    let suggestedCurrency: string | undefined;
    if (text.includes('eur') || text.includes('€')) suggestedCurrency = 'EUR';
    else if (text.includes('inr') || text.includes('₹') || text.includes('rs')) suggestedCurrency = 'INR';
    else if (text.includes('jpy') || text.includes('¥') || text.includes('yen')) suggestedCurrency = 'JPY';
    else if (text.includes('gbp') || text.includes('£')) suggestedCurrency = 'GBP';
    else if (text.includes('usd') || text.includes('$')) suggestedCurrency = 'USD';

    // 2. Amount heuristic (regex for digits with optional decimals e.g. 45.50 or 45)
    let suggestedAmount: number | undefined;
    const amountMatch = text.match(/(?:amount|total|cost|price|sum|bill|eur|usd|inr|[$€₹¥])?\s*([0-9]+(?:[.,][0-9]{2})?)/i);
    if (amountMatch && amountMatch[1]) {
      const parsed = parseFloat(amountMatch[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0 && parsed < 100000) {
        suggestedAmount = parsed;
      }
    }

    // 3. Merchant heuristic
    let suggestedMerchant: string | undefined;
    const cleanFilename = filename
      .replace(/\.[^/.]+$/, '') // remove extension
      .replace(/[-_]/g, ' ')     // replace dashes/underscores with spaces
      .replace(/(receipt|bill|invoice|img|photo|scan|tax)/gi, '')
      .trim();

    if (cleanFilename.length > 2 && cleanFilename.length < 35) {
      suggestedMerchant = cleanFilename
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .trim();
    }

    return {
      suggestedMerchant,
      suggestedAmount,
      suggestedCurrency,
      rawConfidence: suggestedAmount && suggestedMerchant ? 'medium' : 'low',
      disclaimer: 'Receipt metadata extracted via local filename/note heuristics. No external OCR cloud servers used. Please review and confirm fields.',
    };
  }
}

export const receiptScanner = new HeuristicReceiptScanner();