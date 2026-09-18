import { 
  CategoryAllocation, 
  ItineraryDay, 
  ItineraryItem, 
  ItineraryValidationResult 
} from '@/types/travel';

export class TravelEngine {
  /**
   * Calculates trip duration in days deterministically (inclusive of start and end date).
   */
  static calculateTripDuration(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : 0;
  }

  /**
   * Calculates daily budget rounded to 2 decimal places.
   */
  static calculateDailyBudget(totalBudget: number, durationDays: number): number {
    if (durationDays <= 0 || totalBudget <= 0) return 0;
    return Number((totalBudget / durationDays).toFixed(2));
  }

  /**
   * Calculates sum of estimated costs across all category allocations.
   */
  static calculateTotalEstimatedBudget(categories: CategoryAllocation[] = []): number {
    const total = categories.reduce((sum, cat) => sum + (cat.estimatedCost || 0), 0);
    return Number(total.toFixed(2));
  }

  /**
   * Calculates actual spent amount across categories.
   */
  static calculateActualSpent(categories: CategoryAllocation[] = []): number {
    const total = categories.reduce((sum, cat) => sum + (cat.spentAmount || 0), 0);
    return Number(total.toFixed(2));
  }

  /**
   * Calculates remaining budget from total allocated budget and spent/estimated amount.
   */
  static calculateRemainingBudget(totalBudget: number, actualSpent: number): number {
    return Number((totalBudget - actualSpent).toFixed(2));
  }

  /**
   * Calculates budget variance and percentage vs target.
   */
  static calculateBudgetVariance(totalBudget: number, estimatedTotal: number): {
    variance: number;
    percentage: number;
    isOverBudget: boolean;
  } {
    const variance = Number((estimatedTotal - totalBudget).toFixed(2));
    const percentage = totalBudget > 0 ? Number(((estimatedTotal / totalBudget) * 100).toFixed(1)) : 0;
    return {
      variance,
      percentage,
      isOverBudget: estimatedTotal > totalBudget,
    };
  }

  /**
   * Calculates 10% emergency buffer reserve.
   */
  static calculateEmergencyBuffer(totalBudget: number, percentage = 10): number {
    if (totalBudget <= 0) return 0;
    return Number(((totalBudget * percentage) / 100).toFixed(2));
  }

  /**
   * Helper to convert "HH:MM" time string to minutes from midnight for easy comparison.
   */
  static timeToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  /**
   * Detects time overlap conflicts between items on the same day.
   */
  static detectTimeOverlaps(items: ItineraryItem[]): Array<{ item1: ItineraryItem; item2: ItineraryItem }> {
    const overlaps: Array<{ item1: ItineraryItem; item2: ItineraryItem }> = [];

    const activeItems = items.filter(i => i.status !== 'cancelled' && i.startTime && i.endTime);

    for (let i = 0; i < activeItems.length; i++) {
      for (let j = i + 1; j < activeItems.length; j++) {
        const item1 = activeItems[i];
        const item2 = activeItems[j];

        const start1 = this.timeToMinutes(item1.startTime);
        const end1 = this.timeToMinutes(item1.endTime);
        const start2 = this.timeToMinutes(item2.startTime);
        const end2 = this.timeToMinutes(item2.endTime);

        // Check if interval [start1, end1) overlaps with [start2, end2)
        if (start1 < end2 && start2 < end1) {
          overlaps.push({ item1, item2 });
        }
      }
    }

    return overlaps;
  }

  /**
   * Validates a single itinerary item.
   */
  static validateItineraryItem(
    item: ItineraryItem,
    tripStartDate?: string,
    tripEndDate?: string
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!item.activity || !item.activity.trim()) {
      errors.push(`Item ID ${item.id}: Activity name is required.`);
    }

    if (item.estimatedCost && item.estimatedCost.amount < 0) {
      errors.push(`Item "${item.activity || 'Untitled'}": Cost cannot be negative.`);
    }

    if (item.startTime && item.endTime) {
      const startMin = this.timeToMinutes(item.startTime);
      const endMin = this.timeToMinutes(item.endTime);
      if (endMin <= startMin) {
        errors.push(`Item "${item.activity || 'Untitled'}": End time (${item.endTime}) must be after start time (${item.startTime}).`);
      }
    } else {
      warnings.push(`Item "${item.activity || 'Untitled'}": Start or end time missing.`);
    }

    if (item.date && tripStartDate && tripEndDate) {
      if (item.date < tripStartDate || item.date > tripEndDate) {
        errors.push(`Item "${item.activity || 'Untitled'}": Date (${item.date}) falls outside trip dates (${tripStartDate} → ${tripEndDate}).`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Deterministically validates an entire multi-day itinerary schedule.
   */
  static validateItinerarySchedule(
    days: ItineraryDay[] = [],
    tripStartDate?: string,
    tripEndDate?: string
  ): ItineraryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    days.forEach(day => {
      const items = day.items || [];
      const activityNames = new Set<string>();

      items.forEach(item => {
        // Individual item validation
        const itemResult = this.validateItineraryItem(item, tripStartDate, tripEndDate);
        errors.push(...itemResult.errors);
        warnings.push(...itemResult.warnings);

        // Duplicate activity check on same day
        const nameLower = item.activity.trim().toLowerCase();
        if (nameLower && activityNames.has(nameLower)) {
          warnings.push(`Day ${day.dayNumber}: Duplicate activity "${item.activity}" scheduled multiple times.`);
        } else if (nameLower) {
          activityNames.add(nameLower);
        }
      });

      // Overlap check
      const overlaps = this.detectTimeOverlaps(items);
      overlaps.forEach(({ item1, item2 }) => {
        warnings.push(
          `Day ${day.dayNumber} Schedule Overlap: "${item1.activity}" (${item1.startTime}-${item1.endTime}) conflicts with "${item2.activity}" (${item2.startTime}-${item2.endTime}).`
        );
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Normalizes category string input into recognized BudgetCategory enum value.
   */
  static normalizeCategory(catStr: string): import('@/types/travel').BudgetCategory {
    const raw = (catStr || '').toLowerCase().trim().replace(/[\s-]/g, '_');
    if (raw.includes('flight') || raw.includes('plane') || raw.includes('air')) return 'flights';
    if (raw.includes('hotel') || raw.includes('stay') || raw.includes('accommodat')) return 'accommodation';
    if (raw.includes('food') || raw.includes('meal') || raw.includes('dinin') || raw.includes('restaurant')) return 'food';
    if (raw.includes('transport') || raw.includes('taxi') || raw.includes('cab') || raw.includes('subway') || raw.includes('bus')) return 'local_transport';
    if (raw.includes('activity') || raw.includes('tour') || raw.includes('ticket') || raw.includes('sight')) return 'activities';
    if (raw.includes('shop') || raw.includes('gift') || raw.includes('souvenir')) return 'shopping';
    if (raw.includes('insur')) return 'insurance';
    if (raw.includes('emerg')) return 'emergency';
    return 'miscellaneous';
  }

  /**
   * Deterministically applies an expense amount to a budget category and recalculates totals.
   */
  static applyExpense(
    currentBudget: import('@/types/travel').StructuredBudget,
    categoryRaw: string,
    amount: number
  ): import('@/types/travel').StructuredBudget {
    const targetCatKey = this.normalizeCategory(categoryRaw);
    const existingCategories = [...(currentBudget.categories || [])];

    let catIndex = existingCategories.findIndex(c => c.category === targetCatKey);
    if (catIndex >= 0) {
      const existing = existingCategories[catIndex];
      existingCategories[catIndex] = {
        ...existing,
        spentAmount: Number(((existing.spentAmount || 0) + amount).toFixed(2)),
        trustLabel: 'USER_ENTERED',
      };
    } else {
      existingCategories.push({
        category: targetCatKey,
        name: targetCatKey.replace('_', ' ').toUpperCase(),
        allocatedAmount: 0,
        estimatedCost: amount,
        spentAmount: Number(amount.toFixed(2)),
        trustLabel: 'USER_ENTERED',
      });
    }

    const actualSpent = this.calculateActualSpent(existingCategories);
    const estimatedTotal = this.calculateTotalEstimatedBudget(existingCategories);
    const remainingBudget = this.calculateRemainingBudget(currentBudget.totalBudget, actualSpent);

    return {
      ...currentBudget,
      actualSpent,
      estimatedTotal,
      remainingBudget,
      categories: existingCategories,
    };
  }

  /**
   * Recalculates entire structured budget when total budget or currency is updated.
   */
  static recalculateStructuredBudget(
    currentBudget: import('@/types/travel').StructuredBudget,
    newTotalBudget?: number,
    newCurrency?: string
  ): import('@/types/travel').StructuredBudget {
    const totalBudget = newTotalBudget !== undefined && newTotalBudget >= 0 ? newTotalBudget : currentBudget.totalBudget;
    const currency = newCurrency || currentBudget.currency || 'USD';
    const emergencyBuffer = this.calculateEmergencyBuffer(totalBudget, 10);
    const actualSpent = this.calculateActualSpent(currentBudget.categories || []);
    const estimatedTotal = this.calculateTotalEstimatedBudget(currentBudget.categories || []);
    const remainingBudget = this.calculateRemainingBudget(totalBudget, actualSpent);

    return {
      ...currentBudget,
      totalBudget,
      currency,
      emergencyBuffer,
      actualSpent,
      estimatedTotal,
      remainingBudget,
    };
  }
}

