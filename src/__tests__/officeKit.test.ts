import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OfficeKitBridge, OfficeKitSyncPacket } from '../services/device/OfficeKitBridge';

describe('Phase 13 — OfficeKitBridge', () => {
  const mockTrip = {
    id: 'paris-officekit-trip',
    name: 'Paris OfficeKit Expedition',
    destination: 'Paris',
    itineraryDays: [
      { dayNumber: 1, items: [{ activity: 'Eiffel Tower', location: 'Paris' }] },
      { dayNumber: 2, items: [{ activity: 'Louvre Museum', location: 'Paris' }] },
    ],
    expenses: [
      { id: 'exp-1', amount: 45, currency: 'EUR', baseAmount: 45, category: 'food' },
    ],
    documents: [
      { id: 'doc-1', filename: 'passport.jpg', docType: 'passport' },
    ],
    hotelGuardSessions: [
      { id: 'hg-1', propertyName: 'Hotel Le Marais' },
    ],
    disruptions: [
      { id: 'dis-1', title: 'Rain Delay', severity: 'low' },
    ],
  };

  it('generates a valid Office Kit sync packet with checksum and summary', () => {
    const packet = OfficeKitBridge.generateSyncPacket(mockTrip, 'MOBILE_PHONE');
    assert.strictEqual(packet.version, '1.0');
    assert.strictEqual(packet.tripId, 'paris-officekit-trip');
    assert.strictEqual(packet.sourceDevice, 'MOBILE_PHONE');
    assert.ok(packet.securityHash.startsWith('OKIT-'));
    assert.strictEqual(packet.syncSummary.itineraryCount, 2);
    assert.strictEqual(packet.syncSummary.expensesCount, 1);
    assert.strictEqual(packet.syncSummary.documentsCount, 1);
    assert.strictEqual(packet.syncSummary.hotelGuardSessionsCount, 1);
    assert.strictEqual(packet.syncSummary.disruptionsCount, 1);
  });

  it('parses valid JSON sync packet correctly', () => {
    const packet = OfficeKitBridge.generateSyncPacket(mockTrip, 'LAPTOP_DESKTOP');
    const jsonString = JSON.stringify(packet);
    const result = OfficeKitBridge.parseSyncPacket(jsonString);

    assert.ok(result.packet);
    assert.strictEqual(result.packet.tripId, 'paris-officekit-trip');
    assert.strictEqual(result.packet.sourceDevice, 'LAPTOP_DESKTOP');
    assert.strictEqual(result.error, undefined);
  });

  it('rejects invalid JSON or malformed sync packets gracefully', () => {
    const badResult1 = OfficeKitBridge.parseSyncPacket('invalid-not-json');
    assert.strictEqual(badResult1.packet, null);
    assert.ok(badResult1.error);

    const badResult2 = OfficeKitBridge.parseSyncPacket(JSON.stringify({ someField: 'missing required' }));
    assert.strictEqual(badResult2.packet, null);
    assert.ok(badResult2.error);
  });
});
