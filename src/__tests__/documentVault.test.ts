/**
 * Phase 7 — Document Vault Unit Tests
 * Tests LocalDocumentProcessor, storage key helper, and disclaimer constants.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LocalDocumentProcessor,
  localDocumentProcessor,
  SCANNER_DISCLAIMER,
  REDACTION_DISCLAIMER,
  getStorageKey,
} from '../services/documents/LocalDocumentProcessor';
import type { DocumentPrivacyStatus, TripDocumentType } from '../types/travel';

// -- Disclaimer constants ------------------------------------------------------

describe('Phase 7 — Disclaimer constants', () => {
  it('SCANNER_DISCLAIMER is a non-empty string', () => {
    assert.strictEqual(typeof SCANNER_DISCLAIMER, 'string');
    assert.ok(SCANNER_DISCLAIMER.length > 20, 'SCANNER_DISCLAIMER should be descriptive');
  });

  it('REDACTION_DISCLAIMER is a non-empty string', () => {
    assert.strictEqual(typeof REDACTION_DISCLAIMER, 'string');
    assert.ok(REDACTION_DISCLAIMER.length > 20, 'REDACTION_DISCLAIMER should be descriptive');
  });
});

// -- Storage key helper --------------------------------------------------------

describe('Phase 7 — getStorageKey', () => {
  it('returns consistent key for a given doc ID', () => {
    const key = getStorageKey('doc_abc123');
    assert.strictEqual(key, 'travelshield_doc_doc_abc123');
  });

  it('produces different keys for different doc IDs', () => {
    const key1 = getStorageKey('doc_aaa');
    const key2 = getStorageKey('doc_bbb');
    assert.notStrictEqual(key1, key2);
  });
});

// -- LocalDocumentProcessor ----------------------------------------------------

describe('Phase 7 — LocalDocumentProcessor.scan()', () => {
  const processor = new LocalDocumentProcessor();

  it('detects passport number pattern', () => {
    const matches = processor.scan('Passport: AB1234567 issued in London', 'passport_scan.pdf');
    const fields = matches.map(m => m.field);
    assert.ok(fields.includes('Passport Number'), `Expected "Passport Number" match, got: ${fields.join(', ')}`);
  });

  it('detects email address pattern', () => {
    const matches = processor.scan('Contact: john.doe@example.com for booking', 'booking.pdf');
    const fields = matches.map(m => m.field);
    assert.ok(fields.includes('Email Address'), `Expected "Email Address" match, got: ${fields.join(', ')}`);
  });

  it('detects SSN / National ID pattern', () => {
    const matches = processor.scan('SSN: 123-45-6789', 'id_card.pdf');
    const fields = matches.map(m => m.field);
    assert.ok(fields.includes('National ID / SSN'), `Expected "National ID / SSN" match, got: ${fields.join(', ')}`);
  });

  it('returns empty array for clean text', () => {
    const matches = processor.scan('My lovely Paris itinerary notes', 'paris_notes.txt');
    assert.strictEqual(matches.length, 0, 'Expected no matches for clean text');
  });

  it('each match has required fields: field, pattern, example', () => {
    const matches = processor.scan('Email: test@test.com', 'doc.pdf');
    assert.ok(matches.length > 0, 'Expected at least one match');
    for (const m of matches) {
      assert.ok(typeof m.field === 'string' && m.field.length > 0, 'match.field should be non-empty string');
      assert.ok(typeof m.pattern === 'string' && m.pattern.length > 0, 'match.pattern should be non-empty string');
      assert.ok(typeof m.example === 'string', 'match.example should be a string');
    }
  });

  it('singleton localDocumentProcessor works identically to new instance', () => {
    const text = 'Call me at 555-123-4567';
    const r1 = processor.scan(text, 'test.pdf');
    const r2 = localDocumentProcessor.scan(text, 'test.pdf');
    assert.deepStrictEqual(r1.map(m => m.field), r2.map(m => m.field));
  });
});

// -- DocumentPrivacyStatus type check -----------------------------------------

describe('Phase 7 — DocumentPrivacyStatus valid values', () => {
  it('all required privacy status values are valid string literals', () => {
    const validStatuses: DocumentPrivacyStatus[] = [
      'UNSCANNED',
      'SCANNED',
      'SENSITIVE_DATA_FOUND',
      'REDACTED',
      'PROTECTED_COPY',
      'USER_REVIEW_REQUIRED',
    ];
    for (const s of validStatuses) {
      assert.strictEqual(typeof s, 'string');
      assert.ok(s.length > 0);
    }
  });
});

// -- TripDocumentType type check -----------------------------------------------

describe('Phase 7 — TripDocumentType valid values', () => {
  it('all document types are valid string literals', () => {
    const validTypes: TripDocumentType[] = [
      'passport', 'visa', 'flight', 'hotel', 'insurance', 'identity', 'other',
    ];
    for (const t of validTypes) {
      assert.strictEqual(typeof t, 'string');
      assert.ok(t.length > 0);
    }
  });
});
