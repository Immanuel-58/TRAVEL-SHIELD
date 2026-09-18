export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  proposal?: ActionProposal;
  isConfigError?: boolean;
}

export interface TripContextData {
  id: string;
  name: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  travelStyle: string;
  interests: string[];
  status: string;
}

export type AIActionType = 
  | 'CREATE_TRIP'
  | 'UPDATE_TRIP'
  | 'CREATE_ITINERARY'
  | 'ADD_TO_ITINERARY'
  | 'REMOVE_FROM_ITINERARY'
  | 'UPDATE_BUDGET'
  | 'ADD_EXPENSE'
  | 'REPLAN_TRIP'
  | 'UPDATE_TRIP_BUDGET'
  | 'UPDATE_TRIP_DETAILS'
  | 'GENERATE_INITIAL_ITINERARY'
  | 'SAVE_PLACE'
  | 'REMOVE_SAVED_PLACE'
  | 'SAVE_STAY'
  | 'REMOVE_SAVED_STAY'
  | 'ADD_PLACE_TO_ITINERARY'
  | 'ADD_STAY_COST_TO_BUDGET'
  | 'EXPLORE_SEARCH'
  | 'OPTIMIZE_ROUTE'
  | 'REORDER_ITINERARY_DAY'
  | 'LIST_TRIP_DOCUMENTS'
  | 'CREATE_DISRUPTION'
  | 'APPLY_REPLAN'
  | 'ASK_CLARIFICATION'
  | 'GENERAL_RESPONSE';

export interface AIAction {
  type: AIActionType;
  payload: Record<string, any>;
}

export interface AIResponsePayload {
  message: string;
  action?: AIAction;
}

export interface ActionProposal {
  id: string;
  actionType: AIActionType;
  title: string;
  description: string;
  diffSummary: Array<{ field: string; oldValue: any; newValue: any }>;
  payload: Record<string, any>;
  status: 'pending' | 'applied' | 'dismissed';
}
