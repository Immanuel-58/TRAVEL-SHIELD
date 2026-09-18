import { ChatMessage, TripContextData, AIResponsePayload } from './types';

export interface IAIProvider {
  /** Provider identifier, e.g. 'cloud' or 'local' */
  readonly id: string;
  /** Human-readable provider name */
  readonly name: string;
  /** Sends messages and trip context to the AI model */
  sendMessage(messages: ChatMessage[], context?: TripContextData): Promise<AIResponsePayload>;
}
