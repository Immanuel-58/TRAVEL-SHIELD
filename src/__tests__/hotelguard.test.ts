/**
 * Phase 8 — HotelGuard Unit Tests
 * Tests HotelGuardService: disclaimer, storage key helper,
 * comparison logic, report generation, and type values.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HOTELGUARD_DISCLAIMER,
  generateEvidenceStorageKey,
  MetadataComparisonProvider,
  generateHotelGuardReport,
} from '../services/hotelguard/HotelGuardService';
import type { HotelGuardSessionStatus, HotelEvidenceType, HotelEvidence, HotelGuardSession } from '../types/travel';

// -- Disclaimer ----------------------------------------------------------------

describe('Phase 8 — HotelGuard: Disclaimer', () => {
  it('HOTELGUARD_DISCLAIMER is a non-empty string with key limitation phrases', () => {
    assert.strictEqual(typeof HOTELGUARD_DISCLAIMER, 'string');
    assert.ok(HOTELGUARD_DISCLAIMER.length > 40, 'Disclaimer should be descriptive');
    // Must NOT claim to be proof
    assert.ok(!HOTELGUARD_DISCLAIMER.toLowerCase().includes('legal proof') || HOTELGUARD_DISCLAIMER.includes('does NOT'), 'Disclaimer should not assert legal proof');
  });
});

// -- Storage key helper --------------------------------------------------------

describe('Phase 8 — HotelGuard: generateEvidenceStorageKey', () => {
  it('returns a consistent prefixed key for a given evidence ID', () => {
    const key = generateEvidenceStorageKey('ev_abc123');
    assert.strictEqual(key, 'travelshield_hotelguard_ev_abc123');
  });

  it('produces different keys for different evidence IDs', () => {
    const k1 = generateEvidenceStorageKey('ev_aaa');
    const k2 = generateEvidenceStorageKey('ev_bbb');
    assert.notStrictEqual(k1, k2);
  });
});

// -- MetadataComparisonProvider ------------------------------------------------

function makeEvidence(type: HotelEvidenceType, area: string, i: number): HotelEvidence {
  return {
    id: `ev_${i}`, sessionId: 'sess_1', type,
    filename: `photo${i}.jpg`, capturedAt: new Date().toISOString(),
    size: 100_000, mimeType: 'image/jpeg',
    storageKey: `travelshield_hotelguard_ev_${i}`, area,
  };
}

describe('Phase 8 — HotelGuard: MetadataComparisonProvider', () => {
  const provider = new MetadataComparisonProvider();

  it('returns HIGH confidence when photo counts match and all areas covered', () => {
    const checkIn = [makeEvidence('CHECK_IN', 'Bedroom', 1), makeEvidence('CHECK_IN', 'Bathroom', 2)];
    const checkOut = [makeEvidence('CHECK_OUT', 'Bedroom', 3), makeEvidence('CHECK_OUT', 'Bathroom', 4)];
    const cmp = provider.compare('sess_1', checkIn, checkOut);
    assert.strictEqual(cmp.confidence, 'HIGH');
    assert.strictEqual(cmp.missingAreas.length, 0);
  });

  it('returns MEDIUM confidence when check-out count differs by 1', () => {
    const checkIn = [makeEvidence('CHECK_IN', 'Bedroom', 1), makeEvidence('CHECK_IN', 'Bathroom', 2)];
    const checkOut = [makeEvidence('CHECK_OUT', 'Bedroom', 3)]; // one less
    const cmp = provider.compare('sess_1', checkIn, checkOut);
    assert.ok(['MEDIUM', 'LOW'].includes(cmp.confidence), 'Should not be HIGH with missing areas');
  });

  it('reports missing area when check-in area not covered at check-out', () => {
    const checkIn = [makeEvidence('CHECK_IN', 'Bathroom', 1)];
    const checkOut = [makeEvidence('CHECK_OUT', 'Bedroom', 2)]; // different area
    const cmp = provider.compare('sess_1', checkIn, checkOut);
    assert.ok(cmp.missingAreas.includes('Bathroom'), 'Should detect missing Bathroom area');
  });

  it('comparison result always has required fields', () => {
    const checkIn = [makeEvidence('CHECK_IN', 'Bedroom', 1)];
    const checkOut = [makeEvidence('CHECK_OUT', 'Bedroom', 2)];
    const cmp = provider.compare('sess_1', checkIn, checkOut);
    assert.ok(typeof cmp.id === 'string' && cmp.id.length > 0, 'id should be set');
    assert.ok(typeof cmp.createdAt === 'string', 'createdAt should be set');
    assert.ok(typeof cmp.checkInCount === 'number', 'checkInCount should be number');
    assert.ok(typeof cmp.checkOutCount === 'number', 'checkOutCount should be number');
    assert.ok(Array.isArray(cmp.missingAreas), 'missingAreas should be array');
  });
});

// -- Report generation ---------------------------------------------------------

describe('Phase 8 — HotelGuard: generateHotelGuardReport', () => {
  const now = new Date().toISOString();
  const session: HotelGuardSession = {
    id: 'sess_test',
    tripId: 'trip_1',
    propertyName: 'Grand Test Hotel',
    roomIdentifier: 'Room 101',
    status: 'REPORT_READY',
    createdAt: now,
    updatedAt: now,
    checkInAt: now,
    checkOutAt: now,
    evidence: [
      makeEvidence('CHECK_IN', 'Bedroom', 10),
      makeEvidence('CHECK_OUT', 'Bedroom', 11),
    ],
  };

  it('report contains property name', () => {
    const report = generateHotelGuardReport(session);
    assert.ok(report.includes('Grand Test Hotel'), 'Report should contain property name');
  });

  it('report contains room identifier', () => {
    const report = generateHotelGuardReport(session);
    assert.ok(report.includes('Room 101'), 'Report should contain room identifier');
  });

  it('report contains disclaimer', () => {
    const report = generateHotelGuardReport(session);
    assert.ok(report.includes('DISCLAIMER'), 'Report should contain disclaimer section');
  });

  it('report includes evidence filenames', () => {
    const report = generateHotelGuardReport(session);
    assert.ok(report.includes('photo10.jpg'), 'Report should list check-in evidence filename');
    assert.ok(report.includes('photo11.jpg'), 'Report should list check-out evidence filename');
  });
});

// -- Type value checks ---------------------------------------------------------

describe('Phase 8 — HotelGuard: Type values', () => {
  it('all HotelGuardSessionStatus values are valid strings', () => {
    const statuses: HotelGuardSessionStatus[] = [
      'PENDING', 'CHECK_IN_RECORDED', 'CHECK_OUT_RECORDED',
      'COMPARISON_READY', 'REVIEW_REQUIRED', 'REPORT_READY',
    ];
    for (const s of statuses) {
      assert.strictEqual(typeof s, 'string');
      assert.ok(s.length > 0);
    }
  });

  it('all HotelEvidenceType values are valid strings', () => {
    const types: HotelEvidenceType[] = ['CHECK_IN', 'CHECK_OUT'];
    for (const t of types) {
      assert.strictEqual(typeof t, 'string');
    }
  });
});
