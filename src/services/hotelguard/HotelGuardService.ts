/**
 * HotelGuardService
 *
 * Provides metadata-based evidence comparison and structured report generation.
 *
 * IMPORTANT: No computer vision or AI image analysis is performed.
 * Comparison is based on evidence metadata only (counts, timestamps, areas, notes).
 * This is NOT automatic damage detection. All findings require user review.
 *
 * Phase 8 — TravelShield AI
 */

import { HotelGuardSession, HotelComparison, HotelEvidence } from '@/types/travel';

// --- Disclaimer ---------------------------------------------------------------

export const HOTELGUARD_DISCLAIMER =
  'HotelGuard captures timestamped evidence to support your own records. ' +
  'It does NOT prove who caused damage, provide legal proof, guarantee a ' +
  'successful deposit dispute, or detect every difference automatically. ' +
  'All comparison results are based on metadata only and require your review. ' +
  'Use wording like "potential change" and "needs review" when sharing.';

// --- Storage key helper -------------------------------------------------------

export function generateEvidenceStorageKey(evidenceId: string): string {
  return `travelshield_hotelguard_${evidenceId}`;
}

// --- Provider interface (for future vision model plug-in) ---------------------

export interface IHotelComparisonProvider {
  /**
   * Compare check-in and check-out evidence.
   * @returns HotelComparison metadata object.
   * NOTE: In this implementation, comparison is metadata-only.
   * A future vision-capable provider can replace this with real pixel analysis.
   */
  compare(
    sessionId: string,
    checkInEvidence: HotelEvidence[],
    checkOutEvidence: HotelEvidence[]
  ): HotelComparison;
}

// --- Metadata-based implementation --------------------------------------------

export class MetadataComparisonProvider implements IHotelComparisonProvider {
  compare(
    sessionId: string,
    checkInEvidence: HotelEvidence[],
    checkOutEvidence: HotelEvidence[]
  ): HotelComparison {
    const checkInAreas = [...new Set(checkInEvidence.map(e => e.area || 'Unspecified'))];
    const checkOutAreas = [...new Set(checkOutEvidence.map(e => e.area || 'Unspecified'))];
    const missingAreas = checkInAreas.filter(a => !checkOutAreas.includes(a));

    // Confidence: HIGH = equal photo count and all areas covered; MEDIUM = minor gap; LOW = big gap
    const countDiff = Math.abs(checkInEvidence.length - checkOutEvidence.length);
    const confidence: 'LOW' | 'MEDIUM' | 'HIGH' =
      countDiff === 0 && missingAreas.length === 0
        ? 'HIGH'
        : countDiff <= 2 && missingAreas.length <= 1
        ? 'MEDIUM'
        : 'LOW';

    return {
      id: `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sessionId,
      createdAt: new Date().toISOString(),
      checkInCount: checkInEvidence.length,
      checkOutCount: checkOutEvidence.length,
      userNotes: '',
      reviewedByUser: false,
      confidence,
      checkInAreas,
      checkOutAreas,
      missingAreas,
    };
  }
}

export const metadataComparisonProvider = new MetadataComparisonProvider();

// --- Report generator ---------------------------------------------------------

export function generateHotelGuardReport(session: HotelGuardSession): string {
  const checkIn = session.evidence.filter(e => e.type === 'CHECK_IN');
  const checkOut = session.evidence.filter(e => e.type === 'CHECK_OUT');
  const cmp = session.comparison;

  const lines: string[] = [
    '==================================================',
    'TRAVELSHIELD AI — HOTELGUARD EVIDENCE REPORT',
    '==================================================',
    '',
    `Property:         ${session.propertyName}`,
    session.roomIdentifier ? `Room:             ${session.roomIdentifier}` : '',
    `Session ID:       ${session.id}`,
    `Trip ID:          ${session.tripId}`,
    `Status:           ${session.status}`,
    `Report Generated: ${new Date().toISOString()}`,
    '',
    '--------------------------------------------------',
    'CHECK-IN EVIDENCE',
    '--------------------------------------------------',
    `Recorded At: ${session.checkInAt || 'N/A'}`,
    `Total Photos: ${checkIn.length}`,
    '',
    ...checkIn.map((e, i) => [
      `  [${i + 1}] ${e.filename}`,
      `      Area:      ${e.area || 'Unspecified'}`,
      `      Captured:  ${e.capturedAt}`,
      `      Size:      ${(e.size / 1024).toFixed(1)} KB`,
      e.notes ? `      Notes:     ${e.notes}` : '',
    ].filter(Boolean).join('\n')),
    '',
    '--------------------------------------------------',
    'CHECK-OUT EVIDENCE',
    '--------------------------------------------------',
    `Recorded At: ${session.checkOutAt || 'N/A'}`,
    `Total Photos: ${checkOut.length}`,
    '',
    ...checkOut.map((e, i) => [
      `  [${i + 1}] ${e.filename}`,
      `      Area:      ${e.area || 'Unspecified'}`,
      `      Captured:  ${e.capturedAt}`,
      `      Size:      ${(e.size / 1024).toFixed(1)} KB`,
      e.notes ? `      Notes:     ${e.notes}` : '',
    ].filter(Boolean).join('\n')),
    '',
    '--------------------------------------------------',
    'COMPARISON SUMMARY',
    '--------------------------------------------------',
    cmp ? [
      `Comparison ID:      ${cmp.id}`,
      `Created At:         ${cmp.createdAt}`,
      `Check-In Photos:    ${cmp.checkInCount}`,
      `Check-Out Photos:   ${cmp.checkOutCount}`,
      `Comparison Confidence: ${cmp.confidence} (metadata-based only)`,
      `Check-In Areas:     ${cmp.checkInAreas.join(', ') || 'None specified'}`,
      `Check-Out Areas:    ${cmp.checkOutAreas.join(', ') || 'None specified'}`,
      cmp.missingAreas.length > 0
        ? `POTENTIAL CHANGE — Areas in check-in not in check-out: ${cmp.missingAreas.join(', ')}`
        : 'All check-in areas appear covered at check-out.',
      `Reviewed by User:   ${cmp.reviewedByUser ? 'Yes' : 'No — REVIEW REQUIRED'}`,
      cmp.userNotes ? `\nUser Observations:\n${cmp.userNotes}` : '',
    ].filter(Boolean).join('\n')
    : 'No comparison performed yet.',
    '',
    '--------------------------------------------------',
    'IMPORTANT DISCLAIMER',
    '--------------------------------------------------',
    HOTELGUARD_DISCLAIMER,
    '',
    '==================================================',
    'END OF HOTELGUARD EVIDENCE REPORT',
    '==================================================',
  ].filter(s => s !== undefined);

  return lines.join('\n');
}
