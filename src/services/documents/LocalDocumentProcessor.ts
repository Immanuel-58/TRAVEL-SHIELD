/**
 * LocalDocumentProcessor
 *
 * Pattern-based sensitive data scanner.
 *
 * IMPORTANT: This scanner operates on TEXT ONLY — specifically the document
 * filename and any user-provided notes. It does NOT parse, decode, or read
 * the binary content of uploaded files. This is NOT optical character
 * recognition (OCR). Detection is performed via regular expressions only.
 *
 * Phase 7 — TravelShield AI
 */

import { SensitiveMatch } from '@/types/travel';

// ─── Disclaimer constants ─────────────────────────────────────────────────────

export const SCANNER_DISCLAIMER =
  'Privacy scan is automated and may miss sensitive information. ' +
  'Scanning runs on your device only, using the filename and notes you provide — ' +
  'NOT the file contents. Review all documents carefully before sharing.';

export const REDACTION_DISCLAIMER =
  '"Redacted" and "Protected Copy" statuses are metadata flags only. ' +
  'They do NOT permanently remove or alter data inside the original file. ' +
  'Do not share files assuming they have been permanently redacted.';

// ─── Storage key helper ───────────────────────────────────────────────────────

/** Returns the localStorage key used to store a document''s base64 content. */
export function getStorageKey(docId: string): string {
  return `travelshield_doc_${docId}`;
}

// ─── Scanner interface ────────────────────────────────────────────────────────

export interface ILocalDocumentProcessor {
  scan(text: string, filename: string): SensitiveMatch[];
}

// ─── Pattern definitions ──────────────────────────────────────────────────────

interface SensitivePattern {
  field: string;
  pattern: string;
  regex: RegExp;
  redactExample: (match: string) => string;
}

const SENSITIVE_PATTERNS: SensitivePattern[] = [
  {
    field: 'Passport Number',
    pattern: 'passport_number',
    regex: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
    redactExample: (m) => m.slice(0, 2) + '****' + m.slice(-1),
  },
  {
    field: 'Visa Number',
    pattern: 'visa_number',
    regex: /\bV[0-9]{7,10}\b/gi,
    redactExample: (m) => m.slice(0, 2) + '****',
  },
  {
    field: 'Credit / Debit Card',
    pattern: 'credit_card',
    regex: /\b(?:\d[ -]?){13,19}\d\b/g,
    redactExample: (m) => m.replace(/\d(?=.{4})/g, '*'),
  },
  {
    field: 'Email Address',
    pattern: 'email',
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    redactExample: (m) => {
      const [local, domain] = m.split('@');
      return local.slice(0, 2) + '****@' + domain;
    },
  },
  {
    field: 'Phone Number',
    pattern: 'phone_number',
    regex: /\b(?:\+?[0-9]{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{4}\b/g,
    redactExample: (m) => m.slice(0, 3) + '****' + m.slice(-2),
  },
  {
    field: 'Date of Birth',
    pattern: 'date_of_birth',
    regex: /\b(?:dob|date\s+of\s+birth|born)[:\s]+\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi,
    redactExample: () => '[DOB DETECTED]',
  },
  {
    field: 'National ID / SSN',
    pattern: 'national_id',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    redactExample: (m) => m.slice(0, 3) + '-**-****',
  },
];

// ─── Implementation ───────────────────────────────────────────────────────────

export class LocalDocumentProcessor implements ILocalDocumentProcessor {
  scan(text: string, filename: string): SensitiveMatch[] {
    const combined = `${filename} ${text}`.trim();
    const matches: SensitiveMatch[] = [];
    const seen = new Set<string>();

    for (const patternDef of SENSITIVE_PATTERNS) {
      patternDef.regex.lastIndex = 0;
      const found = combined.match(patternDef.regex);
      if (found && found.length > 0) {
        const dedupeKey = `${patternDef.pattern}:${found[0]}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          matches.push({
            field: patternDef.field,
            pattern: patternDef.pattern,
            example: patternDef.redactExample(found[0]),
          });
        }
      }
    }

    return matches;
  }
}

export const localDocumentProcessor = new LocalDocumentProcessor();
