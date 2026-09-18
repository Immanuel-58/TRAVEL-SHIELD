'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip, TripFormData } from '@/types/trip';
import { StructuredBudget, ItineraryDay, ItineraryItem, Place, Stay, TripDocument, HotelGuardSession, HotelEvidence, HotelGuardSessionStatus } from '@/types/travel';
import { Expense, ExpenseInput } from '@/types/expense';
import { Disruption, ReplanOption, ReplanHistoryEntry } from '@/types/disruption';
import { PlanningService } from '@/services/travel/PlanningService';
import { TravelEngine } from '@/services/travel/TravelEngine';
import { ExpenseService } from '@/services/expense/ExpenseService';
import { currencyProvider } from '@/services/currency/CurrencyProvider';
import { ReplanEngine } from '@/services/disruption/ReplanEngine';

const DEMO_TRIPS: Trip[] = [
  {
    id: 'paris-expedition-2026',
    name: 'Paris Expedition 2026',
    origin: 'New York, USA (JFK)',
    destination: 'Paris, France',
    startDate: '2026-06-12',
    endDate: '2026-06-18',
    travelers: 2,
    budget: 4500,
    currency: 'USD',
    travelStyle: 'balanced',
    interests: ['culture', 'gastronomy', 'architecture'],
    status: 'active',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    itinerarySummary: { totalItems: 8, daysCount: 7 },
    expensesSummary: { totalSpent: 1350, categoriesCount: 3 },
    documentsSummary: { totalDocs: 2, shieldActive: true },
    hotelGuardSummary: { totalInspections: 1, verifiedLogs: 1 },
    expenses: [
      {
        id: 'exp-demo-1',
        tripId: 'paris-expedition-2026',
        amount: 450,
        currency: 'EUR',
        baseAmount: 486,
        baseCurrency: 'USD',
        exchangeRate: 1.08,
        rateSource: 'CACHED',
        category: 'accommodation',
        description: 'Hotel Le Marais deposit',
        merchant: 'Hotel Le Marais',
        date: '2026-06-12',
        paymentMethod: 'credit_card',
        notes: 'Deposit paid at check-in',
        createdAt: '2026-06-12T14:00:00Z',
        updatedAt: '2026-06-12T14:00:00Z',
        syncStatus: 'synced',
      },
      {
        id: 'exp-demo-2',
        tripId: 'paris-expedition-2026',
        amount: 85,
        currency: 'EUR',
        baseAmount: 91.8,
        baseCurrency: 'USD',
        exchangeRate: 1.08,
        rateSource: 'CACHED',
        category: 'food',
        description: 'Dinner at Bistro Vivienne',
        merchant: 'Bistro Vivienne',
        date: '2026-06-12',
        paymentMethod: 'credit_card',
        notes: 'Wine and duck confit',
        createdAt: '2026-06-12T20:30:00Z',
        updatedAt: '2026-06-12T20:30:00Z',
        syncStatus: 'synced',
      },
      {
        id: 'exp-demo-3',
        tripId: 'paris-expedition-2026',
        amount: 12,
        currency: 'EUR',
        baseAmount: 12.96,
        baseCurrency: 'USD',
        exchangeRate: 1.08,
        rateSource: 'CACHED',
        category: 'food',
        description: 'Morning espresso and croissants',
        merchant: 'Cafe de Flore',
        date: '2026-06-13',
        paymentMethod: 'cash',
        notes: 'Small breakfast expense',
        createdAt: '2026-06-13T09:15:00Z',
        updatedAt: '2026-06-13T09:15:00Z',
        syncStatus: 'synced',
      },
      {
        id: 'exp-demo-4',
        tripId: 'paris-expedition-2026',
        amount: 9.5,
        currency: 'EUR',
        baseAmount: 10.26,
        baseCurrency: 'USD',
        exchangeRate: 1.08,
        rateSource: 'CACHED',
        category: 'transport',
        description: 'Metro ticket pack',
        merchant: 'RATP Metro',
        date: '2026-06-13',
        paymentMethod: 'cash',
        notes: 'Station vending machine',
        createdAt: '2026-06-13T10:00:00Z',
        updatedAt: '2026-06-13T10:00:00Z',
        syncStatus: 'synced',
      },
    ],
    disruptions: [
      {
        id: 'disrupt-demo-paris-1',
        tripId: 'paris-expedition-2026',
        type: 'FLIGHT_DELAY',
        title: 'Flight AF123 Delayed by 3 Hours',
        description: 'Inbound flight from JFK delayed due to holding patterns over CDG. Projected arrival pushed back 180 minutes.',
        detectedAt: '2026-06-12T14:30:00Z',
        affectedDate: '2026-06-12',
        affectedItineraryItemIds: ['item-1', 'item-2'],
        severity: 'high',
        source: 'demo',
        status: 'active',
        metadata: {
          delayMinutes: 180,
          flightNumber: 'AF123',
          originalArrival: '14:30',
          revisedArrival: '17:30',
        },
        createdAt: '2026-06-12T14:30:00Z',
        updatedAt: '2026-06-12T14:30:00Z',
      }
    ],
    replanHistory: [],
  },
  {
    id: 'tokyo-autumn-2026',
    name: 'Tokyo & Kyoto Autumn',
    origin: 'San Francisco, USA (SFO)',
    destination: 'Tokyo, Japan',
    startDate: '2026-10-05',
    endDate: '2026-10-19',
    travelers: 1,
    budget: 6000,
    currency: 'USD',
    travelStyle: 'luxury',
    interests: ['technology', 'temples', 'food'],
    status: 'upcoming',
    createdAt: '2026-05-15T14:30:00Z',
    updatedAt: '2026-05-15T14:30:00Z',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  }
];

interface TripContextType {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTripId: string | null;
  isLoading: boolean;
  error: string | null;
  createTrip: (data: TripFormData) => Trip;
  updateTrip: (id: string, partial: Partial<TripFormData>) => Trip | undefined;
  addItineraryItem: (tripId: string, item: Omit<ItineraryItem, 'id'>) => Trip | undefined;
  removeItineraryItem: (tripId: string, dayNumber: number, itemId: string) => Trip | undefined;
  updateItineraryItem: (tripId: string, dayNumber: number, itemId: string, updates: Partial<ItineraryItem>) => Trip | undefined;
  updateTripBudget: (tripId: string, budgetData: Partial<StructuredBudget>) => Trip | undefined;
  addExpense: (tripId: string, category: string, amount: number, title?: string) => Trip | undefined;
  replanItinerary: (tripId: string, newDays: ItineraryDay[]) => Trip | undefined;
  savePlace: (tripId: string, place: Place) => Trip | undefined;
  removeSavedPlace: (tripId: string, placeId: string) => Trip | undefined;
  saveStay: (tripId: string, stay: Stay) => Trip | undefined;
  removeSavedStay: (tripId: string, stayId: string) => Trip | undefined;
  addPlaceToItinerary: (tripId: string, place: Place, dayNumber: number, startTime?: string) => Trip | undefined;
  addStayCostToBudget: (tripId: string, stay: Stay, nights?: number) => Trip | undefined;
  reorderItineraryDay: (tripId: string, dayNumber: number, orderedItemIds: string[]) => Trip | undefined;
  deleteTrip: (id: string) => void;
  getTripById: (id: string) => Trip | undefined;
  setActiveTripId: (id: string) => void;
  resetDemoData: () => void;
  importTripData: (tripData: Trip) => void;
  // Phase 7 Document Vault
  addDocument: (tripId: string, doc: TripDocument) => Trip | undefined;
  removeDocument: (tripId: string, docId: string) => Trip | undefined;
  updateDocument: (tripId: string, docId: string, updates: Partial<TripDocument>) => Trip | undefined;
  getDocumentStorageData: (storageKey: string) => string | null;
  // Phase 8 HotelGuard
  createHotelGuardSession: (tripId: string, propertyName: string, roomIdentifier?: string) => HotelGuardSession | undefined;
  addHotelEvidence: (tripId: string, sessionId: string, evidence: HotelEvidence) => Trip | undefined;
  updateHotelGuardSession: (tripId: string, sessionId: string, updates: Partial<HotelGuardSession>) => Trip | undefined;
  getHotelGuardSession: (tripId: string, sessionId: string) => HotelGuardSession | undefined;
  // Phase 10 Expenses & Multi-Currency
  addTripExpense: (tripId: string, expenseInput: ExpenseInput) => { trip?: Trip; expense?: Expense };
  updateTripExpense: (tripId: string, expenseId: string, updates: Partial<Expense>) => Trip | undefined;
  deleteTripExpense: (tripId: string, expenseId: string) => Trip | undefined;
  // Phase 11 Disruptions & Replans
  reportDisruption: (tripId: string, disruption: Disruption) => Trip | undefined;
  resolveDisruption: (tripId: string, disruptionId: string) => Trip | undefined;
  dismissDisruption: (tripId: string, disruptionId: string) => Trip | undefined;
  applyReplanOption: (tripId: string, option: ReplanOption) => { trip?: Trip; historyEntry?: ReplanHistoryEntry };
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const STORAGE_KEY = 'travelshield_trips_v2';
const ACTIVE_KEY = 'travelshield_active_trip_id_v2';

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedTrips = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_KEY);

      if (storedTrips) {
        const parsed: Trip[] = JSON.parse(storedTrips);

        // Ensure all loaded trips have structuredBudget and itineraryDays hydrated
        const hydrated = parsed.map(t => {
          if (!t.structuredBudget || !t.itineraryDays) {
            const plan = PlanningService.generateInitialTripPlan(t);
            return {
              ...t,
              structuredBudget: t.structuredBudget || plan.budget,
              itineraryDays: t.itineraryDays || plan.itineraryDays,
              itinerarySummary: { totalItems: plan.itineraryDays.reduce((sum, d) => sum + d.items.length, 0), daysCount: plan.itineraryDays.length },
            };
          }
          return t;
        });

        setTrips(hydrated);
        if (storedActiveId && hydrated.some((t: Trip) => t.id === storedActiveId)) {
          setActiveTripIdState(storedActiveId);
        } else if (hydrated.length > 0) {
          setActiveTripIdState(hydrated[0].id);
        }
      } else {
        // Hydrate demo trips with PlanningService
        const hydratedDemo = DEMO_TRIPS.map(t => {
          const plan = PlanningService.generateInitialTripPlan(t);
          return {
            ...t,
            structuredBudget: plan.budget,
            itineraryDays: plan.itineraryDays,
            itinerarySummary: { totalItems: plan.itineraryDays.reduce((sum, d) => sum + d.items.length, 0), daysCount: plan.itineraryDays.length },
          };
        });

        setTrips(hydratedDemo);
        setActiveTripIdState(hydratedDemo[0].id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedDemo));
        localStorage.setItem(ACTIVE_KEY, hydratedDemo[0].id);
      }
    } catch (err) {
      console.error('Failed to load trips from storage:', err);
      setError('Unable to load stored trips.');
      setTrips(DEMO_TRIPS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveTripsToStorage = (updatedTrips: Trip[], activeId?: string) => {
    setTrips(updatedTrips);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
    if (activeId) {
      setActiveTripIdState(activeId);
      localStorage.setItem(ACTIVE_KEY, activeId);
    }
  };

  const setActiveTripId = (id: string) => {
    setActiveTripIdState(id);
    localStorage.setItem(ACTIVE_KEY, id);
  };

  const createTrip = (data: TripFormData): Trip => {
    const rawTrip: Trip = {
      ...data,
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    };

    const plan = PlanningService.generateInitialTripPlan(rawTrip);
    const newTrip: Trip = {
      ...rawTrip,
      structuredBudget: plan.budget,
      itineraryDays: plan.itineraryDays,
      itinerarySummary: { totalItems: plan.itineraryDays.reduce((sum, d) => sum + d.items.length, 0), daysCount: plan.itineraryDays.length },
    };

    const updated = [newTrip, ...trips];
    saveTripsToStorage(updated, newTrip.id);
    return newTrip;
  };

  const updateTrip = (id: string, partial: Partial<TripFormData>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === id) {
        const merged = {
          ...t,
          ...partial,
          updatedAt: new Date().toISOString(),
        };

        // Recalculate duration & daily budget if parameters change
        if (partial.startDate || partial.endDate || partial.budget) {
          const duration = TravelEngine.calculateTripDuration(merged.startDate, merged.endDate);
          if (merged.structuredBudget) {
            merged.structuredBudget = {
              ...merged.structuredBudget,
              totalBudget: merged.budget,
              remainingBudget: TravelEngine.calculateRemainingBudget(merged.budget, merged.structuredBudget.actualSpent || 0),
            };
          }
        }

        updatedTrip = merged;
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const addItineraryItem = (tripId: string, itemData: Omit<ItineraryItem, 'id'>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const newItem: ItineraryItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const days = t.itineraryDays ? [...t.itineraryDays] : [];
        let dayObj = days.find(d => d.dayNumber === itemData.dayNumber);

        if (!dayObj) {
          dayObj = { dayNumber: itemData.dayNumber, date: itemData.date, items: [] };
          days.push(dayObj);
          days.sort((a, b) => a.dayNumber - b.dayNumber);
        }

        dayObj.items = [...dayObj.items, newItem];

        const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);

        updatedTrip = {
          ...t,
          itineraryDays: days,
          itinerarySummary: { totalItems, daysCount: days.length },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const removeItineraryItem = (tripId: string, dayNumber: number, itemId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.itineraryDays) {
        const days = t.itineraryDays.map(day => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              items: day.items.filter(i => i.id !== itemId && i.activity.toLowerCase() !== itemId.toLowerCase()),
            };
          }
          return day;
        });

        const totalItems = days.reduce((sum, d) => sum + d.items.length, 0);

        updatedTrip = {
          ...t,
          itineraryDays: days,
          itinerarySummary: { totalItems, daysCount: days.length },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const updateItineraryItem = (tripId: string, dayNumber: number, itemId: string, updates: Partial<ItineraryItem>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.itineraryDays) {
        const days = t.itineraryDays.map(day => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              items: day.items.map(item => (item.id === itemId ? { ...item, ...updates } : item)),
            };
          }
          return day;
        });

        updatedTrip = {
          ...t,
          itineraryDays: days,
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const updateTripBudget = (tripId: string, budgetData: Partial<StructuredBudget>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const currentBudget = t.structuredBudget || PlanningService.generateInitialTripPlan(t).budget;
        const recalculated = TravelEngine.recalculateStructuredBudget(
          { ...currentBudget, ...budgetData },
          budgetData.totalBudget !== undefined ? budgetData.totalBudget : t.budget,
          budgetData.currency || t.currency
        );

        updatedTrip = {
          ...t,
          budget: recalculated.totalBudget,
          currency: recalculated.currency,
          structuredBudget: recalculated,
          expensesSummary: {
            totalSpent: recalculated.actualSpent,
            categoriesCount: recalculated.categories.filter(c => c.spentAmount > 0).length,
          },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const addTripExpense = (tripId: string, expenseInput: ExpenseInput): { trip?: Trip; expense?: Expense } => {
    const targetTrip = trips.find(t => t.id === tripId);
    if (!targetTrip) return {};

    const expenseRecord = ExpenseService.createExpenseRecord(targetTrip, expenseInput);
    let updatedTrip: Trip | undefined;

    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const currentExpenses = t.expenses || [];
        const newExpenses = [expenseRecord, ...currentExpenses];
        const currentBudget = t.structuredBudget || PlanningService.generateInitialTripPlan(t).budget;
        const updatedBudget = TravelEngine.applyExpense(currentBudget, expenseRecord.category, expenseRecord.baseAmount);

        updatedTrip = {
          ...t,
          expenses: newExpenses,
          structuredBudget: updatedBudget,
          expensesSummary: {
            totalSpent: updatedBudget.actualSpent,
            categoriesCount: updatedBudget.categories.filter(c => c.spentAmount > 0).length,
          },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return { trip: updatedTrip, expense: expenseRecord };
  };

  const updateTripExpense = (tripId: string, expenseId: string, updates: Partial<Expense>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const currentExpenses = t.expenses || [];
        const newExpenses = currentExpenses.map(exp => {
          if (exp.id === expenseId) {
            const merged = { ...exp, ...updates, updatedAt: new Date().toISOString() };
            if (updates.amount !== undefined || updates.currency !== undefined || updates.exchangeRate !== undefined) {
              const conv = currencyProvider.convert(
                merged.amount,
                merged.currency,
                merged.baseCurrency,
                merged.exchangeRate
              );
              merged.baseAmount = conv.baseAmount;
              merged.rateSource = conv.source;
            }
            return merged;
          }
          return exp;
        });

        const totalBase = Number(newExpenses.reduce((s, e) => s + (e.baseAmount || 0), 0).toFixed(2));
        let budget = t.structuredBudget || PlanningService.generateInitialTripPlan(t).budget;
        budget = { ...budget, actualSpent: totalBase, remainingBudget: Math.max(0, Number((budget.totalBudget - totalBase).toFixed(2))) };

        updatedTrip = {
          ...t,
          expenses: newExpenses,
          structuredBudget: budget,
          expensesSummary: {
            totalSpent: totalBase,
            categoriesCount: new Set(newExpenses.map(e => e.category)).size,
          },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const deleteTripExpense = (tripId: string, expenseId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const currentExpenses = t.expenses || [];
        const newExpenses = currentExpenses.filter(exp => exp.id !== expenseId);

        const totalBase = Number(newExpenses.reduce((s, e) => s + (e.baseAmount || 0), 0).toFixed(2));
        let budget = t.structuredBudget || PlanningService.generateInitialTripPlan(t).budget;
        budget = { ...budget, actualSpent: totalBase, remainingBudget: Math.max(0, Number((budget.totalBudget - totalBase).toFixed(2))) };

        updatedTrip = {
          ...t,
          expenses: newExpenses,
          structuredBudget: budget,
          expensesSummary: {
            totalSpent: totalBase,
            categoriesCount: new Set(newExpenses.map(e => e.category)).size,
          },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const addExpense = (tripId: string, category: string, amount: number, title?: string): Trip | undefined => {
    const res = addTripExpense(tripId, {
      amount,
      currency: 'USD',
      category: TravelEngine.normalizeCategory(category) as any,
      description: title || 'Trip Expense',
    });
    return res.trip;
  };

  const replanItinerary = (tripId: string, newDays: ItineraryDay[]): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const totalItems = newDays.reduce((sum, d) => sum + d.items.length, 0);
        updatedTrip = {
          ...t,
          itineraryDays: newDays,
          itinerarySummary: { totalItems, daysCount: newDays.length },
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const savePlace = (tripId: string, place: Place): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const saved = t.savedPlaces ? [...t.savedPlaces] : [];
        if (!saved.some(p => p.id === place.id)) {
          saved.push({ ...place, savedStatus: true });
        }
        updatedTrip = { ...t, savedPlaces: saved, updatedAt: new Date().toISOString() };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const removeSavedPlace = (tripId: string, placeId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.savedPlaces) {
        const saved = t.savedPlaces.filter(p => p.id !== placeId);
        updatedTrip = { ...t, savedPlaces: saved, updatedAt: new Date().toISOString() };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const saveStay = (tripId: string, stay: Stay): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const saved = t.savedStays ? [...t.savedStays] : [];
        if (!saved.some(s => s.id === stay.id)) {
          saved.push({ ...stay, savedStatus: true });
        }
        updatedTrip = { ...t, savedStays: saved, updatedAt: new Date().toISOString() };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const removeSavedStay = (tripId: string, stayId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.savedStays) {
        const saved = t.savedStays.filter(s => s.id !== stayId);
        updatedTrip = { ...t, savedStays: saved, updatedAt: new Date().toISOString() };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const addPlaceToItinerary = (tripId: string, place: Place, dayNumber: number, startTime = '10:00'): Trip | undefined => {
    const startMin = TravelEngine.timeToMinutes(startTime);
    const endMin = startMin + (place.estimatedVisitDurationMinutes || 120);
    const endHours = Math.floor(endMin / 60) % 24;
    const endMins = endMin % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    return addItineraryItem(tripId, {
      dayNumber,
      date: getTripById(tripId)?.startDate || '2026-06-12',
      activity: place.name,
      location: place.address || place.destination,
      coordinates: place.coordinates,
      locationTrustLabel: place.coordinates ? (place.trustLabel || 'ESTIMATED') : 'UNKNOWN',
      placeId: place.id,
      startTime,
      endTime,
      durationMinutes: place.estimatedVisitDurationMinutes || 120,
      estimatedCost: {
        amount: place.estimatedCost?.amount || 0,
        currency: place.estimatedCost?.currency || getTripById(tripId)?.currency || 'USD',
        trustLabel: place.trustLabel || 'ESTIMATED',
      },
      travelTimeMinutes: 15,
      notes: place.description,
      status: 'planned',
    });
  };

  const addStayCostToBudget = (tripId: string, stay: Stay, nights = 1): Trip | undefined => {
    const totalCost = (stay.estimatedPricePerNight?.amount || 0) * nights;
    return addExpense(tripId, 'accommodation', totalCost, `Accommodation: ${stay.name} (${nights} night(s))`);
  };

  const reorderItineraryDay = (tripId: string, dayNumber: number, orderedItemIds: string[]): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.itineraryDays) {
        const days = t.itineraryDays.map(day => {
          if (day.dayNumber === dayNumber) {
            const itemMap = new Map(day.items.map(item => [item.id, item]));
            const reorderedItems: ItineraryItem[] = [];

            orderedItemIds.forEach(id => {
              const item = itemMap.get(id);
              if (item) {
                reorderedItems.push(item);
                itemMap.delete(id);
              }
            });

            // Append any unreferenced items
            itemMap.forEach(item => reorderedItems.push(item));

            return {
              ...day,
              items: reorderedItems,
            };
          }
          return day;
        });

        updatedTrip = {
          ...t,
          itineraryDays: days,
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) {
      saveTripsToStorage(updatedList);
    }
    return updatedTrip;
  };

  const deleteTrip = (id: string) => {
    const updated = trips.filter(t => t.id !== id);
    const nextActive = updated.length > 0 ? updated[0].id : null;
    saveTripsToStorage(updated, nextActive || undefined);
    if (!nextActive) {
      setActiveTripIdState(null);
      localStorage.removeItem(ACTIVE_KEY);
    }
  };

  const getTripById = (id: string): Trip | undefined => {
    return trips.find(t => t.id === id);
  };

  const resetDemoData = () => {
    const hydratedDemo = DEMO_TRIPS.map(t => {
      const plan = PlanningService.generateInitialTripPlan(t);
      return {
        ...t,
        structuredBudget: plan.budget,
        itineraryDays: plan.itineraryDays,
        itinerarySummary: { totalItems: plan.itineraryDays.reduce((sum, d) => sum + d.items.length, 0), daysCount: plan.itineraryDays.length },
        expensesSummary: { totalSpent: plan.budget.actualSpent, categoriesCount: 0 },
      };
    });

    setTrips(hydratedDemo);
    setActiveTripIdState(hydratedDemo[0].id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedDemo));
    localStorage.setItem(ACTIVE_KEY, hydratedDemo[0].id);
  };

  const importTripData = (tripData: Trip) => {
    setTrips(prev => {
      const exists = prev.some(t => t.id === tripData.id);
      const updated = exists ? prev.map(t => t.id === tripData.id ? tripData : t) : [...prev, tripData];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const activeTrip = trips.find(t => t.id === activeTripId) || null;

  // ── Phase 7: Document Vault ──────────────────────────────────────────────

  const addDocument = (tripId: string, doc: TripDocument): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id !== tripId) return t;
      updatedTrip = {
        ...t,
        documents: [...(t.documents || []), doc],
        documentsSummary: {
          totalDocs: (t.documents || []).length + 1,
          shieldActive: true,
        },
        updatedAt: new Date().toISOString(),
      };
      return updatedTrip;
    });
    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const removeDocument = (tripId: string, docId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id !== tripId) return t;
      const remaining = (t.documents || []).filter(d => d.id !== docId);
      updatedTrip = {
        ...t,
        documents: remaining,
        documentsSummary: {
          totalDocs: remaining.length,
          shieldActive: remaining.length > 0,
        },
        updatedAt: new Date().toISOString(),
      };
      return updatedTrip;
    });
    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const updateDocument = (tripId: string, docId: string, updates: Partial<TripDocument>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id !== tripId) return t;
      updatedTrip = {
        ...t,
        documents: (t.documents || []).map(d =>
          d.id === docId ? { ...d, ...updates } : d
        ),
        updatedAt: new Date().toISOString(),
      };
      return updatedTrip;
    });
    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const getDocumentStorageData = (storageKey: string): string | null => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  // ── Phase 8: HotelGuard ──────────────────────────────────────────────────

  const createHotelGuardSession = (
    tripId: string, propertyName: string, roomIdentifier?: string
  ): HotelGuardSession | undefined => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return undefined;
    const now = new Date().toISOString();
    const session: HotelGuardSession = {
      id: `hg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      tripId,
      propertyName,
      roomIdentifier,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      evidence: [],
    };
    const updatedTrips = trips.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        hotelGuardSessions: [...(t.hotelGuardSessions || []), session],
        hotelGuardSummary: {
          totalInspections: (t.hotelGuardSessions || []).length + 1,
          verifiedLogs: (t.hotelGuardSummary?.verifiedLogs || 0),
        },
        updatedAt: now,
      };
    });
    saveTripsToStorage(updatedTrips);
    return session;
  };

  const addHotelEvidence = (tripId: string, sessionId: string, evidence: HotelEvidence): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id !== tripId) return t;
      const now = new Date().toISOString();
      const sessions = (t.hotelGuardSessions || []).map(s => {
        if (s.id !== sessionId) return s;
        const newEvidence = [...s.evidence, evidence];
        const hasCheckIn = newEvidence.some(e => e.type === 'CHECK_IN');
        const hasCheckOut = newEvidence.some(e => e.type === 'CHECK_OUT');
        const status: HotelGuardSessionStatus = hasCheckIn && hasCheckOut ? 'COMPARISON_READY'
          : hasCheckOut ? 'CHECK_OUT_RECORDED'
          : hasCheckIn ? 'CHECK_IN_RECORDED'
          : 'PENDING';
        return {
          ...s,
          evidence: newEvidence,
          status,
          checkInAt: evidence.type === 'CHECK_IN' && !s.checkInAt ? evidence.capturedAt : s.checkInAt,
          checkOutAt: evidence.type === 'CHECK_OUT' && !s.checkOutAt ? evidence.capturedAt : s.checkOutAt,
          updatedAt: now,
        };
      });
      const updated: Trip = { ...t, hotelGuardSessions: sessions, updatedAt: now };
      updatedTrip = updated;
      return updated;
    });
    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const updateHotelGuardSession = (tripId: string, sessionId: string, updates: Partial<HotelGuardSession>): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id !== tripId) return t;
      const now = new Date().toISOString();
      const sessions = (t.hotelGuardSessions || []).map(s =>
        s.id === sessionId ? { ...s, ...updates, updatedAt: now } : s
      );
      const updated: Trip = { ...t, hotelGuardSessions: sessions, updatedAt: now };
      updatedTrip = updated;
      return updated;
    });
    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const getHotelGuardSession = (tripId: string, sessionId: string): HotelGuardSession | undefined => {
    const trip = trips.find(t => t.id === tripId);
    return trip?.hotelGuardSessions?.find(s => s.id === sessionId);
  };

  // Phase 11 Disruptions & Replans
  const reportDisruption = (tripId: string, disruption: Disruption): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId) {
        const currentDisruptions = t.disruptions || [];
        const newDisruptions = [disruption, ...currentDisruptions.filter(d => d.id !== disruption.id)];
        updatedTrip = {
          ...t,
          disruptions: newDisruptions,
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const resolveDisruption = (tripId: string, disruptionId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.disruptions) {
        updatedTrip = {
          ...t,
          disruptions: t.disruptions.map(d => d.id === disruptionId ? { ...d, status: 'resolved', resolvedAt: new Date().toISOString() } : d),
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const dismissDisruption = (tripId: string, disruptionId: string): Trip | undefined => {
    let updatedTrip: Trip | undefined;
    const updatedList = trips.map(t => {
      if (t.id === tripId && t.disruptions) {
        updatedTrip = {
          ...t,
          disruptions: t.disruptions.map(d => d.id === disruptionId ? { ...d, status: 'dismissed' } : d),
          updatedAt: new Date().toISOString(),
        };
        return updatedTrip;
      }
      return t;
    });

    if (updatedTrip) saveTripsToStorage(updatedList);
    return updatedTrip;
  };

  const applyReplanOption = (tripId: string, option: ReplanOption): { trip?: Trip; historyEntry?: ReplanHistoryEntry } => {
    const targetTrip = trips.find(t => t.id === tripId);
    if (!targetTrip) return {};

    const { updatedTrip, historyEntry } = ReplanEngine.applyReplan(targetTrip, option);
    const updatedList = trips.map(t => t.id === tripId ? updatedTrip : t);
    saveTripsToStorage(updatedList);
    return { trip: updatedTrip, historyEntry };
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        activeTripId,
        isLoading,
        error,
        createTrip,
        updateTrip,
        addItineraryItem,
        removeItineraryItem,
        updateItineraryItem,
        updateTripBudget,
        addExpense,
        replanItinerary,
        savePlace,
        removeSavedPlace,
        saveStay,
        removeSavedStay,
        addPlaceToItinerary,
        addStayCostToBudget,
        reorderItineraryDay,
        deleteTrip,
        getTripById,
        setActiveTripId,
        resetDemoData,
        importTripData,
        addDocument,
        removeDocument,
        updateDocument,
        getDocumentStorageData,
        createHotelGuardSession,
        addHotelEvidence,
        updateHotelGuardSession,
        getHotelGuardSession,
        addTripExpense,
        updateTripExpense,
        deleteTripExpense,
        reportDisruption,
        resolveDisruption,
        dismissDisruption,
        applyReplanOption,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
