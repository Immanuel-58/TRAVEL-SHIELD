import { IAIProvider } from './AIProvider';
import { ChatMessage, TripContextData, AIResponsePayload } from './types';

export class CloudAIProvider implements IAIProvider {
  readonly id = 'cloud';
  readonly name = 'CloudAIProvider (OpenAI API)';

  async sendMessage(messages: ChatMessage[], context?: TripContextData): Promise<AIResponsePayload> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          tripContext: context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      const data: AIResponsePayload = await response.json();
      return data;
    } catch (err: any) {
      console.error('CloudAIProvider request error:', err);
      throw err;
    }
  }
}

export const cloudAIProvider = new CloudAIProvider();
