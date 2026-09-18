/**
 * OfflineIntentParser
 * 
 * Local natural language intent classification for voice commands and offline travel assistant input.
 * Converts spoken or typed phrases into deterministic ActionProposals without contacting any cloud API.
 * 
 * CORE RULES:
 * - Deterministic parsing: NO hallucinated schema or unvalidated database mutations.
 * - Always emits an ActionProposal that requires user review and approval before mutation.
 */

import { ActionProposal, AIActionType } from './types';

export interface ParsedOfflineIntent {
  matched: boolean;
  intentType: AIActionType | 'QUERY_ANSWER';
  confidence: 'high' | 'medium' | 'low';
  replyText: string;
  proposal?: ActionProposal;
}

export class OfflineIntentParser {
  static parse(text: string, tripContext?: any): ParsedOfflineIntent {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. ADD EXPENSE INTENT
    // e.g. "Spent 45 euros on dinner", "paid 15 dollars for taxi", "add expense 30 usd lunch"
    const expenseRegex = /(?:spent|paid|spend|cost|bought|add expense)\s+([0-9]+(?:\.[0-9]{1,2})?)\s*(eur|usd|inr|gbp|jpy|dollars?|euros?|rupees?|bucks?)?\s*(?:for|on|at)?\s*(.*)/i;
    const expenseMatch = lower.match(expenseRegex);
    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1]);
      let currency = (expenseMatch[2] || tripContext?.currency || 'USD').toUpperCase();
      if (currency.startsWith('EURO') || currency === 'EUR') currency = 'EUR';
      else if (currency.startsWith('DOLLAR') || currency === 'BUCKS') currency = 'USD';
      else if (currency.startsWith('RUPEE')) currency = 'INR';

      const descriptionRaw = expenseMatch[3]?.trim() || 'General Travel Expense';
      const description = descriptionRaw.charAt(0).toUpperCase() + descriptionRaw.slice(1);

      let category: 'food' | 'transport' | 'lodging' | 'activities' | 'other' = 'other';
      if (/dinner|lunch|breakfast|food|coffee|restaurant|cafe|meal|drinks/i.test(descriptionRaw)) category = 'food';
      else if (/taxi|uber|metro|train|flight|bus|gas|transit/i.test(descriptionRaw)) category = 'transport';
      else if (/hotel|airbnb|hostel|stay|resort/i.test(descriptionRaw)) category = 'lodging';
      else if (/museum|tour|ticket|entry|attraction|show/i.test(descriptionRaw)) category = 'activities';

      const proposal: ActionProposal = {
        id: `prop-exp-${Date.now()}`,
        actionType: 'ADD_EXPENSE',
        title: `Log Expense: ${currency} ${amount} (${category.toUpperCase()})`,
        description: `Voice-detected expense for "${description}". Review and confirm to add to your ledger.`,
        diffSummary: [
          { field: 'Amount', oldValue: 'None', newValue: `${currency} ${amount}` },
          { field: 'Category', oldValue: 'None', newValue: category.toUpperCase() },
          { field: 'Description', oldValue: 'None', newValue: description },
        ],
        payload: {
          amount,
          currency,
          category,
          description,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
        },
        status: 'pending',
      };

      return {
        matched: true,
        intentType: 'ADD_EXPENSE',
        confidence: 'high',
        replyText: `I detected an expense of **${currency} ${amount}** for *${description}* (${category}). Please confirm the proposal below to record it into your trip budget.`,
        proposal,
      };
    }

    // 2. DISRUPTION / DELAY / WEATHER INTENT
    // e.g. "My flight is delayed 3 hours", "rain tomorrow replan", "museum is closed"
    if (/delay|delayed|cancel|cancelled|cancellation|rain|storm|closed|closure|strike/i.test(lower)) {
      let disruptionType: 'FLIGHT_DELAY' | 'FLIGHT_CANCELLATION' | 'WEATHER_EVENT' | 'VENUE_CLOSURE' | 'TRANSIT_DISRUPTION' | 'SCHEDULE_CHANGE' = 'SCHEDULE_CHANGE';
      let title = 'Travel Disruption';
      let severity: 'low' | 'medium' | 'high' = 'medium';

      if (/flight.*delay|delayed.*flight|flight/i.test(lower)) {
        disruptionType = 'FLIGHT_DELAY';
        title = 'Flight Delay Reported';
        severity = 'high';
      } else if (/rain|storm|weather|snow|hurricane/i.test(lower)) {
        disruptionType = 'WEATHER_EVENT';
        title = 'Inclement Weather Disruption';
        severity = 'medium';
      } else if (/closed|closure|maintenance/i.test(lower)) {
        disruptionType = 'VENUE_CLOSURE';
        title = 'Venue / Attraction Closure';
        severity = 'medium';
      } else if (/transit|metro|train|strike|subway/i.test(lower)) {
        disruptionType = 'TRANSIT_DISRUPTION';
        title = 'Transit Suspension / Delay';
        severity = 'medium';
      }

      const proposal: ActionProposal = {
        id: `prop-disrupt-${Date.now()}`,
        actionType: 'CREATE_DISRUPTION',
        title: `Report Disruption: ${title}`,
        description: `Voice/offline detected disruption: "${raw}". Review to generate replan options.`,
        diffSummary: [
          { field: 'Type', oldValue: 'Normal Schedule', newValue: disruptionType },
          { field: 'Severity', oldValue: 'None', newValue: severity.toUpperCase() },
          { field: 'Details', oldValue: 'None', newValue: raw },
        ],
        payload: {
          title,
          type: disruptionType,
          description: raw,
          severity,
          status: 'active',
          source: 'USER_REPORTED',
          trustLabel: 'USER_REPORTED',
          impactedItemIds: [],
        },
        status: 'pending',
      };

      return {
        matched: true,
        intentType: 'CREATE_DISRUPTION',
        confidence: 'high',
        replyText: `I recorded a **${title}** report from your voice command. Confirming this proposal will register the disruption and analyze schedule replan options.`,
        proposal,
      };
    }

    // 3. ADD ITINERARY ITEM INTENT
    // e.g. "Add Eiffel Tower tomorrow at 4 PM", "Visit Louvre at 10:00", "Schedule dinner at 8pm"
    const itineraryRegex = /(?:add|visit|schedule|go to)\s+(.*?)(?:\s+(?:on|at|tomorrow|day\s*([0-9]+))\s*(.*))?$/i;
    const itinMatch = lower.match(itineraryRegex);
    if (itinMatch && itinMatch[1] && itinMatch[1].length > 2 && !itinMatch[1].startsWith('expense')) {
      const placeName = itinMatch[1]
        .replace(/\b(tomorrow|at|on|today)\b.*$/i, '')
        .trim();
      const cleanName = placeName.charAt(0).toUpperCase() + placeName.slice(1);

      let time = '14:00';
      const timeMatch = raw.match(/([0-9]{1,2})(?::([0-9]{2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const mins = timeMatch[2] || '00';
        const meridian = timeMatch[3]?.toLowerCase();
        if (meridian === 'pm' && hour < 12) hour += 12;
        if (meridian === 'am' && hour === 12) hour = 0;
        time = `${hour.toString().padStart(2, '0')}:${mins}`;
      }

      let dayNumber = 1;
      const dayMatch = lower.match(/day\s*([0-9]+)/i);
      if (dayMatch) {
        dayNumber = parseInt(dayMatch[1], 10);
      } else if (lower.includes('tomorrow')) {
        dayNumber = 2;
      }

      const proposal: ActionProposal = {
        id: `prop-itin-${Date.now()}`,
        actionType: 'ADD_TO_ITINERARY',
        title: `Add to Itinerary: ${cleanName}`,
        description: `Scheduled for Day ${dayNumber} at ${time}.`,
        diffSummary: [
          { field: 'Activity', oldValue: 'None', newValue: cleanName },
          { field: 'Day', oldValue: 'None', newValue: `Day ${dayNumber}` },
          { field: 'Start Time', oldValue: 'None', newValue: time },
        ],
        payload: {
          dayNumber,
          activity: cleanName,
          startTime: time,
          durationMinutes: 90,
          location: cleanName,
        },
        status: 'pending',
      };

      return {
        matched: true,
        intentType: 'ADD_TO_ITINERARY',
        confidence: 'medium',
        replyText: `I drafted an itinerary proposal to add **${cleanName}** on **Day ${dayNumber}** at **${time}**. Please review the details below.`,
        proposal,
      };
    }

    return {
      matched: false,
      intentType: 'QUERY_ANSWER',
      confidence: 'low',
      replyText: '',
    };
  }
}
