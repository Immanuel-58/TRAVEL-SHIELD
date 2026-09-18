import { Trip } from '@/types/trip';
import { TravelEngine } from '@/services/travel/TravelEngine';
import { AIAction, AIActionType, AIResponsePayload, ActionProposal } from './types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  action?: AIAction;
}

const VALID_ACTIONS: AIActionType[] = [
  'CREATE_TRIP',
  'UPDATE_TRIP',
  'CREATE_ITINERARY',
  'ADD_TO_ITINERARY',
  'REMOVE_FROM_ITINERARY',
  'UPDATE_BUDGET',
  'ADD_EXPENSE',
  'REPLAN_TRIP',
  'UPDATE_TRIP_BUDGET',
  'UPDATE_TRIP_DETAILS',
  'GENERATE_INITIAL_ITINERARY',
  'SAVE_PLACE',
  'REMOVE_SAVED_PLACE',
  'SAVE_STAY',
  'REMOVE_SAVED_STAY',
  'ADD_PLACE_TO_ITINERARY',
  'ADD_STAY_COST_TO_BUDGET',
  'EXPLORE_SEARCH',
  'OPTIMIZE_ROUTE',
  'REORDER_ITINERARY_DAY',
  'LIST_TRIP_DOCUMENTS',
  'CREATE_DISRUPTION',
  'APPLY_REPLAN',
  'ASK_CLARIFICATION',
  'GENERAL_RESPONSE',
];

/**
 * Step 1: Schema Validation
 * Validates that an incoming AI action has a recognized type and valid structural payload.
 */
export function validateAIAction(action: any): ValidationResult {
  if (!action || typeof action !== 'object') {
    return { isValid: false, error: 'AI action is not an object.' };
  }

  if (!action.type || !VALID_ACTIONS.includes(action.type)) {
    return { isValid: false, error: `Invalid or unrecognized action type: "${action.type}".` };
  }

  if (!action.payload || typeof action.payload !== 'object') {
    return { isValid: false, error: 'AI action payload is missing or malformed.' };
  }

  const { type, payload } = action;

  switch (type) {
    case 'UPDATE_BUDGET':
    case 'UPDATE_TRIP_BUDGET':
      if (typeof payload.amount !== 'number' || isNaN(payload.amount)) {
        return { isValid: false, error: 'Budget update payload must include a valid numeric amount.' };
      }
      break;

    case 'UPDATE_TRIP':
    case 'UPDATE_TRIP_DETAILS':
      if (payload.travelers !== undefined && (typeof payload.travelers !== 'number' || payload.travelers < 1)) {
        return { isValid: false, error: 'Travelers count must be a positive integer >= 1.' };
      }
      if (payload.startDate && payload.endDate) {
        if (payload.endDate < payload.startDate) {
          return { isValid: false, error: 'End date cannot be earlier than start date.' };
        }
      }
      break;

    case 'ADD_TO_ITINERARY':
      if (!payload.dayNumber || typeof payload.dayNumber !== 'number') {
        return { isValid: false, error: 'ADD_TO_ITINERARY requires a numeric dayNumber.' };
      }
      if (!payload.activity || typeof payload.activity !== 'string') {
        return { isValid: false, error: 'ADD_TO_ITINERARY requires an activity description string.' };
      }
      break;

    case 'REMOVE_FROM_ITINERARY':
      if (!payload.dayNumber || typeof payload.dayNumber !== 'number') {
        return { isValid: false, error: 'REMOVE_FROM_ITINERARY requires a numeric dayNumber.' };
      }
      if (!payload.activityName && !payload.itemId) {
        return { isValid: false, error: 'REMOVE_FROM_ITINERARY requires activityName or itemId.' };
      }
      break;

    case 'ADD_EXPENSE':
      if (!payload.title || typeof payload.title !== 'string') {
        return { isValid: false, error: 'ADD_EXPENSE requires a title string.' };
      }
      if (typeof payload.amount !== 'number' || payload.amount <= 0) {
        return { isValid: false, error: 'ADD_EXPENSE requires a positive numeric amount.' };
      }
      break;

    case 'SAVE_PLACE':
      if (!payload.name || typeof payload.name !== 'string') {
        return { isValid: false, error: 'SAVE_PLACE requires a place name string.' };
      }
      break;

    case 'SAVE_STAY':
      if (!payload.name || typeof payload.name !== 'string') {
        return { isValid: false, error: 'SAVE_STAY requires a stay name string.' };
      }
      break;

    case 'ADD_PLACE_TO_ITINERARY':
      if (!payload.name && !payload.place?.name) {
        return { isValid: false, error: 'ADD_PLACE_TO_ITINERARY requires place name.' };
      }
      if (!payload.dayNumber || typeof payload.dayNumber !== 'number') {
        return { isValid: false, error: 'ADD_PLACE_TO_ITINERARY requires a numeric dayNumber.' };
      }
      break;

    case 'ADD_STAY_COST_TO_BUDGET':
      if (!payload.name && !payload.stay?.name) {
        return { isValid: false, error: 'ADD_STAY_COST_TO_BUDGET requires stay name.' };
      }
      break;

    case 'CREATE_ITINERARY':
    case 'GENERATE_INITIAL_ITINERARY':
      if (!Array.isArray(payload.days) && !payload.summary) {
        return { isValid: false, error: 'Itinerary generation payload must contain days array or summary.' };
      }
      break;

    case 'OPTIMIZE_ROUTE':
      if (typeof payload.dayNumber !== 'number' || payload.dayNumber < 1) {
        return { isValid: false, error: 'Route optimization payload must include a valid dayNumber >= 1.' };
      }
      break;

    case 'REORDER_ITINERARY_DAY':
      if (typeof payload.dayNumber !== 'number' || payload.dayNumber < 1) {
        return { isValid: false, error: 'Reorder itinerary payload must include a valid dayNumber >= 1.' };
      }
      if (!Array.isArray(payload.orderedItemIds) || payload.orderedItemIds.length === 0) {
        return { isValid: false, error: 'Reorder itinerary payload must include orderedItemIds array.' };
      }
      break;

    case 'LIST_TRIP_DOCUMENTS':
      // No required payload fields — AI just triggers a document listing
      break;

    case 'CREATE_DISRUPTION':
      if (!payload.title || typeof payload.title !== 'string') {
        return { isValid: false, error: 'CREATE_DISRUPTION requires a title string.' };
      }
      if (!payload.type || typeof payload.type !== 'string') {
        return { isValid: false, error: 'CREATE_DISRUPTION requires a disruption type string.' };
      }
      break;

    case 'APPLY_REPLAN':
      if (!payload.optionId && !payload.option?.id) {
        return { isValid: false, error: 'APPLY_REPLAN requires an optionId or option object.' };
      }
      break;
  }

  return { isValid: true, action: { type, payload } };
}

/**
 * Step 2: Deterministic Business Logic Validation via TravelEngine
 * Deterministic checks ensuring business constraints are respected before generating a proposal.
 */
export function validateBusinessRules(action: AIAction, currentTrip: Trip): { isValid: boolean; error?: string } {
  switch (action.type) {
    case 'UPDATE_BUDGET':
    case 'UPDATE_TRIP_BUDGET': {
      const amount = action.payload.amount;
      if (amount < 0) {
        return { isValid: false, error: 'Budget cannot be a negative value.' };
      }
      if (amount > 10000000) {
        return { isValid: false, error: 'Budget exceeds maximum single-trip limit ($10,000,000).' };
      }
      break;
    }

    case 'UPDATE_TRIP':
    case 'UPDATE_TRIP_DETAILS': {
      const { startDate, endDate } = action.payload;
      const effectiveStart = startDate || currentTrip.startDate;
      const effectiveEnd = endDate || currentTrip.endDate;

      if (effectiveStart && effectiveEnd) {
        const days = TravelEngine.calculateTripDuration(effectiveStart, effectiveEnd);
        if (days <= 0) {
          return { isValid: false, error: 'Trip duration must be at least 1 day.' };
        }
      }
      break;
    }

    case 'ADD_TO_ITINERARY':
    case 'ADD_PLACE_TO_ITINERARY': {
      const dayNum = action.payload.dayNumber;
      const totalDays = TravelEngine.calculateTripDuration(currentTrip.startDate, currentTrip.endDate) || 7;
      if (dayNum < 1 || dayNum > totalDays) {
        return { isValid: false, error: `Day number ${dayNum} is outside trip range (1 to ${totalDays} days).` };
      }
      if (action.payload.estimatedCost && action.payload.estimatedCost < 0) {
        return { isValid: false, error: 'Activity estimated cost cannot be negative.' };
      }
      break;
    }

    case 'ADD_EXPENSE': {
      if (action.payload.amount <= 0) {
        return { isValid: false, error: 'Expense amount must be greater than zero.' };
      }
      break;
    }

    case 'OPTIMIZE_ROUTE':
    case 'REORDER_ITINERARY_DAY': {
      const dayNum = action.payload.dayNumber;
      const totalDays = TravelEngine.calculateTripDuration(currentTrip.startDate, currentTrip.endDate) || (currentTrip.itineraryDays?.length || 7);
      if (dayNum < 1 || dayNum > totalDays) {
        return { isValid: false, error: `Day number ${dayNum} is outside trip duration range (1 to ${totalDays}).` };
      }
      break;
    }
  }

  return { isValid: true };
}

/**
 * Step 3: Create Interactive Action Proposal Card
 * Formats a validated action into a diff summary for user confirmation before applying to state.
 */
export function createActionProposal(action: AIAction, currentTrip: Trip): ActionProposal {
  const proposalId = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const diffs: Array<{ field: string; oldValue: any; newValue: any }> = [];

  let title = 'Proposed Trip Change';
  let description = 'The AI has suggested updates to your trip workspace.';

  switch (action.type) {
    case 'UPDATE_BUDGET':
    case 'UPDATE_TRIP_BUDGET': {
      const newAmount = action.payload.amount;
      const newCurrency = action.payload.currency || currentTrip.currency;
      title = 'Update Target Budget';
      description = `Adjust total trip budget to ${newCurrency} $${newAmount.toLocaleString()}`;
      diffs.push({
        field: 'Target Budget',
        oldValue: `${currentTrip.currency} $${currentTrip.budget.toLocaleString()}`,
        newValue: `${newCurrency} $${newAmount.toLocaleString()}`,
      });
      break;
    }

    case 'ADD_TO_ITINERARY': {
      title = `Add Activity to Day ${action.payload.dayNumber}`;
      description = `Schedule "${action.payload.activity}" on Day ${action.payload.dayNumber}.`;
      diffs.push({
        field: `Day ${action.payload.dayNumber} Activity`,
        oldValue: 'New Item',
        newValue: `${action.payload.activity} (${action.payload.startTime || '10:00'} - ${action.payload.endTime || '11:30'})`,
      });
      break;
    }

    case 'SAVE_PLACE': {
      title = `Save Place to Trip`;
      description = `Save "${action.payload.name}" to trip research vault.`;
      diffs.push({
        field: 'Saved Places',
        oldValue: `${currentTrip.savedPlaces?.length || 0} Places`,
        newValue: `Save ${action.payload.name}`,
      });
      break;
    }

    case 'SAVE_STAY': {
      title = `Save Accommodation to Trip`;
      description = `Save stay "${action.payload.name}" to trip research vault.`;
      diffs.push({
        field: 'Saved Stays',
        oldValue: `${currentTrip.savedStays?.length || 0} Stays`,
        newValue: `Save ${action.payload.name}`,
      });
      break;
    }

    case 'ADD_PLACE_TO_ITINERARY': {
      const placeName = action.payload.name || action.payload.place?.name || 'Place';
      title = `Add Place to Day ${action.payload.dayNumber}`;
      description = `Schedule "${placeName}" on Day ${action.payload.dayNumber}.`;
      diffs.push({
        field: `Day ${action.payload.dayNumber} Schedule`,
        oldValue: 'Unscheduled',
        newValue: `${placeName} (${action.payload.startTime || '10:00'})`,
      });
      break;
    }

    case 'ADD_STAY_COST_TO_BUDGET': {
      const stayName = action.payload.name || action.payload.stay?.name || 'Stay';
      const cost = action.payload.amount || action.payload.estimatedPricePerNight?.amount || 150;
      title = `Add Stay Cost to Accommodation Budget`;
      description = `Log accommodation cost for "${stayName}" (${currentTrip.currency} $${cost}).`;
      diffs.push({
        field: 'Accommodation Expense',
        oldValue: 'Unlogged',
        newValue: `${stayName}: $${cost}`,
      });
      break;
    }

    case 'REMOVE_FROM_ITINERARY': {
      title = `Remove Activity from Day ${action.payload.dayNumber}`;
      description = `Remove "${action.payload.activityName || 'activity'}" from Day ${action.payload.dayNumber}.`;
      diffs.push({
        field: `Day ${action.payload.dayNumber} Schedule`,
        oldValue: action.payload.activityName || 'Target Activity',
        newValue: 'Removed',
      });
      break;
    }

    case 'ADD_EXPENSE': {
      title = 'Log New Expense Entry';
      description = `Log expense "${action.payload.title}" for $${action.payload.amount}`;
      diffs.push({
        field: 'Logged Expense',
        oldValue: 'New Expense',
        newValue: `${action.payload.title}: $${action.payload.amount}`,
      });
      break;
    }

    case 'REPLAN_TRIP':
    case 'CREATE_ITINERARY':
    case 'GENERATE_INITIAL_ITINERARY': {
      title = 'Replan Itinerary Schedule';
      description = action.payload.reason || action.payload.summary || 'Generate new day-by-day itinerary outline.';
      diffs.push({
        field: 'Itinerary Schedule',
        oldValue: 'Existing Plan',
        newValue: 'Updated Multi-Day Structure',
      });
      break;
    }

    case 'UPDATE_TRIP':
    case 'UPDATE_TRIP_DETAILS': {
      title = 'Update Trip Parameters';
      description = 'Modify trip workspace parameters.';
      if (action.payload.name && action.payload.name !== currentTrip.name) {
        diffs.push({ field: 'Trip Name', oldValue: currentTrip.name, newValue: action.payload.name });
      }
      if (action.payload.destination && action.payload.destination !== currentTrip.destination) {
        diffs.push({ field: 'Destination', oldValue: currentTrip.destination, newValue: action.payload.destination });
      }
      if (action.payload.travelers !== undefined && action.payload.travelers !== currentTrip.travelers) {
        diffs.push({ field: 'Travelers', oldValue: currentTrip.travelers, newValue: action.payload.travelers });
      }
      if (action.payload.travelStyle && action.payload.travelStyle !== currentTrip.travelStyle) {
        diffs.push({ field: 'Travel Style', oldValue: currentTrip.travelStyle, newValue: action.payload.travelStyle });
      }
      if (action.payload.startDate && action.payload.startDate !== currentTrip.startDate) {
        diffs.push({ field: 'Start Date', oldValue: currentTrip.startDate, newValue: action.payload.startDate });
      }
      if (action.payload.endDate && action.payload.endDate !== currentTrip.endDate) {
        diffs.push({ field: 'End Date', oldValue: currentTrip.endDate, newValue: action.payload.endDate });
      }
      break;
    }

    case 'OPTIMIZE_ROUTE': {
      const dayNum = action.payload.dayNumber;
      title = `Geographic Route Optimization (Day ${dayNum})`;
      description = `Reorder Day ${dayNum} activities geographically to reduce travel distance and transit time.`;
      diffs.push({
        field: `Day ${dayNum} Route Order`,
        oldValue: 'Current Schedule Sequence',
        newValue: 'Geographically Optimized Order (Trust: ESTIMATED)',
      });
      break;
    }

    case 'REORDER_ITINERARY_DAY': {
      const dayNum = action.payload.dayNumber;
      title = `Reorder Itinerary Schedule (Day ${dayNum})`;
      description = `Update sequence of activities on Day ${dayNum} to cluster nearby places together.`;
      diffs.push({
        field: `Day ${dayNum} Schedule`,
        oldValue: 'Current Sequence',
        newValue: `${(action.payload.orderedItemIds || []).length} activities reordered`,
      });
      break;
    }

    case 'LIST_TRIP_DOCUMENTS': {
      title = 'Trip Documents Overview';
      description = 'Show document metadata from this trip\'s Document Vault. File contents are never shared with AI — only names, types, and privacy status.';
      diffs.push({
        field: 'Document Access',
        oldValue: 'N/A',
        newValue: 'Metadata only (filename, type, status, date)',
      });
      break;
    }

    case 'CREATE_DISRUPTION': {
      title = `Report Disruption: ${action.payload.title}`;
      description = action.payload.description || 'Record travel event and compute schedule impact.';
      diffs.push({
        field: 'Disruption Event',
        oldValue: 'Active Normal Plan',
        newValue: `${action.payload.title} (${action.payload.severity || 'medium'})`,
      });
      diffs.push({
        field: 'Affected Scope',
        oldValue: 'None',
        newValue: action.payload.affectedDate ? `Date: ${action.payload.affectedDate}` : 'Itinerary Schedule',
      });
      break;
    }

    case 'APPLY_REPLAN': {
      const optTitle = action.payload.optionTitle || action.payload.option?.title || 'Selected Replan Strategy';
      title = `Apply Replan: ${optTitle}`;
      description = action.payload.summary || action.payload.option?.description || 'Execute validated itinerary changes.';
      diffs.push({
        field: 'Schedule Alternative',
        oldValue: 'Current Disrupted Schedule',
        newValue: optTitle,
      });
      diffs.push({
        field: 'Cost Impact',
        oldValue: 'Existing Budget',
        newValue: action.payload.costImpactSummary || 'Neutral ($0)',
      });
      break;
    }
  }

  return {
    id: proposalId,
    actionType: action.type,
    title,
    description,
    diffSummary: diffs,
    payload: action.payload,
    status: 'pending',
  };
}

/**
 * Main Pipeline Orchestrator:
 * Executes AI Response -> Schema Validation -> Business Validation -> Action Proposal creation.
 */
export function processAIResponse(
  aiResponse: AIResponsePayload,
  currentTrip: Trip
): { message: string; proposal?: ActionProposal; error?: string } {
  const message = aiResponse.message || 'I have analyzed your request.';

  if (!aiResponse.action || aiResponse.action.type === 'GENERAL_RESPONSE' || aiResponse.action.type === 'ASK_CLARIFICATION') {
    return { message };
  }

  // 1. Schema Validation
  const schemaValidation = validateAIAction(aiResponse.action);
  if (!schemaValidation.isValid || !schemaValidation.action) {
    return {
      message: `${message}\n\n[System Alert: AI proposed an action, but schema validation failed: ${schemaValidation.error}]`,
      error: schemaValidation.error,
    };
  }

  // 2. Business Validation via TravelEngine
  const businessValidation = validateBusinessRules(schemaValidation.action, currentTrip);
  if (!businessValidation.isValid) {
    return {
      message: `${message}\n\n[System Alert: Proposed change rejected by TravelEngine validation: ${businessValidation.error}]`,
      error: businessValidation.error,
    };
  }

  // 3. Create Action Proposal for user confirmation
  const proposal = createActionProposal(schemaValidation.action, currentTrip);
  return { message, proposal };
}
