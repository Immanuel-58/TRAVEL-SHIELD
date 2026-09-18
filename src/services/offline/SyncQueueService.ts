/**
 * SyncQueueService
 * 
 * Manages the offline mutation queue. When a traveler edits their trip while offline,
 * actions are queued locally, applied immediately to the local trip cache, and
 * reconciled safely with validation upon reconnection.
 */

import { Trip } from '@/types/trip';
import { SyncQueueItem, SyncActionType } from '@/types/offline';
import { OfflineStorage } from './OfflineStorage';
import { TravelEngine } from '@/services/travel/TravelEngine';
import { ReplanEngine } from '@/services/disruption/ReplanEngine';

export class SyncQueueService {
  /**
   * Enqueues an action performed while offline.
   */
  static enqueue(tripId: string, actionType: SyncActionType, payload: Record<string, any>): SyncQueueItem {
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tripId,
      actionType,
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    OfflineStorage.addToSyncQueue(item);
    return item;
  }

  /**
   * Gets pending changes count for a specific trip or globally.
   */
  static getPendingCount(tripId?: string): number {
    const queue = OfflineStorage.getSyncQueue(tripId);
    return queue.filter(item => item.status === 'pending' || item.status === 'failed').length;
  }

  /**
   * Applies an offline change to the in-memory/local Trip object deterministically.
   */
  static applyLocally(trip: Trip, item: SyncQueueItem): { success: boolean; trip: Trip; error?: string } {
    try {
      const cloned: Trip = JSON.parse(JSON.stringify(trip));

      switch (item.actionType) {
        case 'ADD_ITINERARY_ITEM': {
          const { dayNumber, item: newItem } = item.payload;
          if (!cloned.itineraryDays) cloned.itineraryDays = [];
          let day = cloned.itineraryDays.find(d => d.dayNumber === dayNumber);
          if (!day) {
            day = { dayNumber, date: cloned.startDate, items: [] };
            cloned.itineraryDays.push(day);
            cloned.itineraryDays.sort((a, b) => a.dayNumber - b.dayNumber);
          }
          if (!day.items) day.items = [];
          const itemWithId = {
            ...newItem,
            id: newItem.id || `item-offline-${Date.now()}`,
          };
          day.items.push(itemWithId);
          break;
        }

        case 'REMOVE_ITINERARY_ITEM': {
          const { dayNumber, itemId } = item.payload;
          if (cloned.itineraryDays) {
            const day = cloned.itineraryDays.find(d => d.dayNumber === dayNumber);
            if (day && day.items) {
              day.items = day.items.filter(i => i.id !== itemId);
            }
          }
          break;
        }

        case 'UPDATE_BUDGET': {
          const { amount } = item.payload;
          if (typeof amount === 'number' && amount >= 0) {
            cloned.budget = amount;
            if (cloned.structuredBudget) {
              cloned.structuredBudget = TravelEngine.recalculateStructuredBudget(
                cloned.structuredBudget,
                amount,
                cloned.currency
              );
            }
          } else {
            return { success: false, trip, error: 'Budget amount must be positive' };
          }
          break;
        }

        case 'ADD_EXPENSE': {
          if (!cloned.expenses) cloned.expenses = [];
          const newExp = item.payload.expense;
          if (newExp) {
            cloned.expenses = [newExp, ...cloned.expenses];
            const totalBase = Number(cloned.expenses.reduce((s, e) => s + (e.baseAmount || 0), 0).toFixed(2));
            if (cloned.structuredBudget) {
              cloned.structuredBudget.actualSpent = totalBase;
              cloned.structuredBudget.remainingBudget = Math.max(0, Number((cloned.structuredBudget.totalBudget - totalBase).toFixed(2)));
            }
            cloned.expensesSummary = {
              totalSpent: totalBase,
              categoriesCount: new Set(cloned.expenses.map(e => e.category)).size,
            };
          }
          break;
        }

        case 'UPDATE_EXPENSE': {
          if (cloned.expenses) {
            cloned.expenses = cloned.expenses.map(e => e.id === item.payload.expenseId ? { ...e, ...item.payload.updates } : e);
            const totalBase = Number(cloned.expenses.reduce((s, e) => s + (e.baseAmount || 0), 0).toFixed(2));
            if (cloned.structuredBudget) {
              cloned.structuredBudget.actualSpent = totalBase;
              cloned.structuredBudget.remainingBudget = Math.max(0, Number((cloned.structuredBudget.totalBudget - totalBase).toFixed(2)));
            }
            cloned.expensesSummary = {
              totalSpent: totalBase,
              categoriesCount: new Set(cloned.expenses.map(e => e.category)).size,
            };
          }
          break;
        }

        case 'DELETE_EXPENSE': {
          if (cloned.expenses) {
            cloned.expenses = cloned.expenses.filter(e => e.id !== item.payload.expenseId);
            const totalBase = Number(cloned.expenses.reduce((s, e) => s + (e.baseAmount || 0), 0).toFixed(2));
            if (cloned.structuredBudget) {
              cloned.structuredBudget.actualSpent = totalBase;
              cloned.structuredBudget.remainingBudget = Math.max(0, Number((cloned.structuredBudget.totalBudget - totalBase).toFixed(2)));
            }
            cloned.expensesSummary = {
              totalSpent: totalBase,
              categoriesCount: new Set(cloned.expenses.map(e => e.category)).size,
            };
          }
          break;
        }

        case 'SAVE_PLACE': {
          if (!cloned.savedPlaces) cloned.savedPlaces = [];
          if (!cloned.savedPlaces.some(p => p.id === item.payload.place.id)) {
            cloned.savedPlaces.push(item.payload.place);
          }
          break;
        }

        case 'REMOVE_PLACE': {
          if (cloned.savedPlaces) {
            cloned.savedPlaces = cloned.savedPlaces.filter(p => p.id !== item.payload.placeId);
          }
          break;
        }

        case 'SAVE_STAY': {
          if (!cloned.savedStays) cloned.savedStays = [];
          if (!cloned.savedStays.some(s => s.id === item.payload.stay.id)) {
            cloned.savedStays.push(item.payload.stay);
          }
          break;
        }

        case 'REMOVE_STAY': {
          if (cloned.savedStays) {
            cloned.savedStays = cloned.savedStays.filter(s => s.id !== item.payload.stayId);
          }
          break;
        }

        case 'REPORT_DISRUPTION': {
          if (!cloned.disruptions) cloned.disruptions = [];
          const newDisruption = item.payload.disruption || (item.payload.id ? item.payload : undefined);
          if (newDisruption) {
            cloned.disruptions = [newDisruption, ...cloned.disruptions];
          }
          break;
        }

        case 'RESOLVE_DISRUPTION': {
          if (cloned.disruptions) {
            cloned.disruptions = cloned.disruptions.map(d => 
              d.id === item.payload.disruptionId 
                ? { ...d, status: 'resolved', resolvedAt: new Date().toISOString() } 
                : d
            );
          }
          break;
        }

        case 'APPLY_REPLAN': {
          const option = item.payload.option;
          if (option) {
            const result = ReplanEngine.applyReplan(cloned, option);
            return { success: true, trip: result.updatedTrip };
          }
          break;
        }

        default:
          break;
      }

      cloned.updatedAt = new Date().toISOString();
      return { success: true, trip: cloned };
    } catch (err: any) {
      return { success: false, trip, error: err?.message || 'Failed to apply change locally' };
    }
  }

  /**
   * Reconciles all pending items when connection returns.
   * Checks business constraints and resolves conflicts safely.
   */
  static processSyncQueue(
    trip: Trip,
    itemsToSync?: SyncQueueItem[]
  ): {
    updatedTrip: Trip;
    syncedCount: number;
    conflictCount: number;
    errors: string[];
  } {
    const queue = itemsToSync || OfflineStorage.getSyncQueue(trip.id);
    const pendingItems = queue.filter(
      item => item.status === 'pending' || item.status === 'failed'
    );

    let currentTrip = { ...trip };
    let syncedCount = 0;
    let conflictCount = 0;
    const errors: string[] = [];

    for (const item of pendingItems) {
      OfflineStorage.updateSyncQueueItem(item.id, { status: 'syncing' });

      // Validation logic: check for impossible states or business rule conflicts
      if (item.actionType === 'UPDATE_BUDGET' && item.payload.amount < 0) {
        OfflineStorage.updateSyncQueueItem(item.id, {
          status: 'conflict',
          conflictDetails: 'Budget cannot be negative. Server rejected modification.',
        });
        conflictCount++;
        errors.push(`Action ${item.id}: Negative budget rejected.`);
        continue;
      }

      // Apply action
      const result = this.applyLocally(currentTrip, item);
      if (result.success) {
        currentTrip = result.trip;
        OfflineStorage.updateSyncQueueItem(item.id, {
          status: 'synced',
          retryCount: item.retryCount + 1,
        });
        syncedCount++;
      } else {
        OfflineStorage.updateSyncQueueItem(item.id, {
          status: 'failed',
          error: result.error,
          retryCount: item.retryCount + 1,
        });
        conflictCount++;
        errors.push(`Action ${item.id}: ${result.error}`);
      }
    }

    return {
      updatedTrip: currentTrip,
      syncedCount,
      conflictCount,
      errors,
    };
  }
}