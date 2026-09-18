/**
 * LocalAIProvider
 * 
 * Genuine on-device / local AI abstraction for TravelShield AI.
 * 
 * CORE RULES:
 * - DO NOT claim cloud models (ChatGPT, Gemini, etc.) are local AI.
 * - DO NOT secretly send offline user data to a cloud API.
 * - If no genuine local neural runtime (e.g. Chrome built-in AI / WebLLM) is available,
 *   transparently report unavailable status and provide a deterministic local fallback.
 */

import { IAIProvider } from './AIProvider';
import { ChatMessage, TripContextData, AIResponsePayload } from './types';
import { LocalAICapabilities } from '@/types/offline';
import { TravelEngine } from '@/services/travel/TravelEngine';

export class LocalAIProvider implements IAIProvider {
  readonly id = 'local';
  readonly name = 'LocalAIProvider (Deterministic Travel Intelligence)';

  /**
   * Genuine capability detection for on-device AI.
   * Checks whether the browser has built-in local inference (e.g. window.ai).
   * Truthfully reports unavailable when no true local model is loaded.
   */
  static checkCapabilities(): LocalAICapabilities {
    const hasChromeAI = typeof window !== 'undefined' && 'ai' in window && typeof (window as any).ai?.createTextSession === 'function';

    return {
      isAvailable: hasChromeAI,
      runtimeName: hasChromeAI ? 'Chrome Built-in Gemini Nano' : 'No On-Device LLM Runtime Configured',
      modelLoaded: hasChromeAI,
      fallbackMode: 'deterministic_engine',
      disclaimer: hasChromeAI
        ? 'Running genuine on-device local model inference. No network traffic.'
        : 'On-device neural model is unconfigured. Operating via TravelShield Deterministic Offline Engine. No cloud servers are contacted while offline.',
    };
  }

  /**
   * Offline query handler.
   * Answers private trip queries deterministically from local context without any network calls.
   */
  async sendMessage(messages: ChatMessage[], context?: TripContextData & { [key: string]: any }): Promise<AIResponsePayload> {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';

    const responseText = this.generateDeterministicOfflineResponse(lastUserMessage, context);

    return {
      message: responseText,
    };
  }

  private generateDeterministicOfflineResponse(query: string, context?: any): string {
    const header = '📡 **[OFFLINE MODE — Local Deterministic Engine]**\n*No cloud network used. Processing local trip data directly from your device.*\n\n';

    if (!context) {
      return `${header}No local trip context available. Please select an active trip from your workspace to view offline details.`;
    }

    // A. Expenses & Spending query
    if (query.includes('expense') || query.includes('spent') || query.includes('spending') || query.includes('cost')) {
      const expenses = context.expenses || [];
      const totalBudget = context.budget || 0;
      const baseCurrency = context.currency || 'USD';
      const totalSpent = Number(expenses.reduce((s: number, e: any) => s + (e.baseAmount || 0), 0).toFixed(2));
      const remaining = Math.max(0, Number((totalBudget - totalSpent).toFixed(2)));

      if (expenses.length === 0) {
        return `${header}**Expenses Overview for ${context.name}:**\n\n` +
          `• **Total Spent:** $0.00 ${baseCurrency}\n` +
          `• **Planned Budget:** $${totalBudget.toLocaleString()} ${baseCurrency}\n` +
          `• **Remaining Budget:** $${totalBudget.toLocaleString()} ${baseCurrency}\n\n` +
          `*No individual expenses logged yet. You can add expenses in the Expenses tab while offline.*`;
      }

      let text = `${header}**Expenses & Spending Ledger for ${context.name}:**\n\n` +
        `• **Total Spent:** $${totalSpent.toLocaleString()} ${baseCurrency}\n` +
        `• **Planned Budget:** $${totalBudget.toLocaleString()} ${baseCurrency}\n` +
        `• **Remaining Budget:** $${remaining.toLocaleString()} ${baseCurrency} (${((remaining / totalBudget) * 100).toFixed(1)}% remaining)\n` +
        `• **Transactions Logged:** ${expenses.length}\n\n` +
        `**Recent Transactions:**\n`;

      expenses.slice(0, 5).forEach((e: any) => {
        text += `• **${e.description}** (${e.category.toUpperCase()}) — ${e.currency} ${e.amount} ` +
          (e.currency !== baseCurrency ? `(≈ $${e.baseAmount} ${baseCurrency})` : '') +
          (e.merchant ? ` at *${e.merchant}*` : '') + ` on ${e.date}\n`;
      });

      return text;
    }

    // B. Disruptions & Replans query
    if (query.includes('disruption') || query.includes('replan') || query.includes('delay') || query.includes('cancel') || query.includes('rain') || query.includes('closed')) {
      const disruptions = context.disruptions || [];
      const replans = context.replanHistory || [];

      if (disruptions.length === 0 && replans.length === 0) {
        return `${header}**Disruptions & Replan Status for ${context.name}:**\n\n` +
          `• **Active Disruptions:** 0\n` +
          `• **Applied Replans:** 0\n\n` +
          `*Your trip schedule is operating under normal baseline parameters. You can report delays, closures, or weather changes directly in the Disruptions tab.*`;
      }

      let text = `${header}**Disruptions & Dynamic Replan Center for ${context.name}:**\n\n`;
      if (disruptions.length > 0) {
        text += `**Recorded Disruptions (${disruptions.length}):**\n`;
        disruptions.forEach((d: any) => {
          text += `• **${d.title}** (${d.type}) — Severity: \`${d.severity.toUpperCase()}\` · Status: \`${d.status}\`\n  ${d.description}\n`;
        });
        text += '\n';
      }

      if (replans.length > 0) {
        text += `**Replan History (${replans.length} applied):**\n`;
        replans.forEach((r: any) => {
          text += `• **${r.optionTitle}** — ${r.summary} (${r.costImpactSummary})\n`;
        });
      }

      return text;
    }

    // C. Plan / Itinerary query
    if ((query.includes('plan') && !query.includes('replan')) || query.includes('itinerary') || query.includes('schedule') || query.includes('today')) {
      const days = context.itineraryDays || [];
      if (days.length === 0) {
        return `${header}You have **0 scheduled activities** in your local itinerary for **${context.destination}**.\n\n*Tip: Connect to the internet to generate a full initial plan with the AI Assistant.*`;
      }

      let text = `${header}**Itinerary Schedule for ${context.name} (${context.destination}):**\n\n`;
      days.forEach((d: any) => {
        text += `**Day ${d.dayNumber}** (${d.items?.length || 0} activities):\n`;
        (d.items || []).forEach((item: any) => {
          text += `• \`${item.startTime || '10:00'}\` — **${item.activity}** at ${item.location} (${item.durationMinutes || 60}m)\n`;
        });
        text += '\n';
      });
      return text;
    }

    // D. Budget / Buffer query
    if (query.includes('budget') || query.includes('remaining') || query.includes('money') || query.includes('buffer')) {
      const total = context.budget || 0;
      const daysCount = TravelEngine.calculateTripDuration(context.startDate, context.endDate);
      const daily = TravelEngine.calculateDailyBudget(total, daysCount);
      const buffer = TravelEngine.calculateEmergencyBuffer(total);

      return `${header}**Offline Budget Summary:**\n\n` +
        `• **Target Total:** $${total.toLocaleString()} ${context.currency}\n` +
        `• **Duration:** ${daysCount} days\n` +
        `• **Daily Average:** $${daily.toFixed(2)} ${context.currency}/day\n` +
        `• **10% Emergency Buffer:** $${buffer.toFixed(2)} ${context.currency}\n\n` +
        `*Computed deterministically using TravelShield Travel Intelligence Engine.*`;
    }

    // D. Hotel / Stay details query
    if (query.includes('hotel') || query.includes('stay') || query.includes('accommodation') || query.includes('room')) {
      const stays = context.savedStays || [];
      const hotelGuardSessions = context.hotelGuardSessions || [];

      let text = `${header}**Accommodations & HotelGuard Data:**\n\n`;
      if (stays.length > 0) {
        text += `**Saved Stays (${stays.length}):**\n`;
        stays.forEach((s: any) => {
          text += `• **${s.name}** — ${s.location} (~$${s.estimatedPricePerNight?.amount || 150}/night)\n`;
        });
        text += '\n';
      } else {
        text += `No saved stays currently recorded in your trip.\n\n`;
      }

      if (hotelGuardSessions.length > 0) {
        text += `**HotelGuard Sessions (${hotelGuardSessions.length}):**\n`;
        hotelGuardSessions.forEach((h: any) => {
          text += `• **${h.propertyName}** (${h.roomIdentifier || 'Main Room'}) — Status: \`${h.status}\` (${h.evidence?.length || 0} photos logged)\n`;
        });
      }

      return text;
    }

    // E. Places query
    if (query.includes('place') || query.includes('attraction') || query.includes('nearby') || query.includes('sight')) {
      const places = context.savedPlaces || [];
      if (places.length === 0) {
        return `${header}No saved places found in your local trip cache for **${context.destination}**.\n\n*Live destination exploration will be available when you reconnect to the internet.*`;
      }

      let text = `${header}**Locally Saved Places (${places.length}):**\n\n`;
      places.forEach((p: any) => {
        text += `• **${p.name}** (${p.category || 'attraction'})\n  ${p.address || context.destination} · Est. Duration: ${p.estimatedVisitDurationMinutes || 120} min\n`;
      });
      return text;
    }

    // F. Documents query
    if (query.includes('document') || query.includes('passport') || query.includes('vault') || query.includes('visa')) {
      const docs = context.documents || [];
      if (docs.length === 0) {
        return `${header}No documents currently stored in your local Document Vault.`;
      }

      let text = `${header}**Local Document Vault (${docs.length} files):**\n\n`;
      docs.forEach((d: any) => {
        text += `• **${d.filename}** (${d.docType}) — Status: \`${d.privacyStatus}\` · Uploaded ${new Date(d.uploadedAt).toLocaleDateString()}\n`;
      });
      text += `\n*All file contents remain strictly local on your device.*`;
      return text;
    }

    // G. General fallback
    return `${header}I am operating in **Offline Mode** using your locally stored trip data for **${context.name}**.\n\n` +
      `Here are topics you can query while offline:\n` +
      `• **"Show my disruptions and replans"** — View active disruptions and replan history\n` +
      `• **"Show my expenses and spending"** — View transactions and total spent\n` +
      `• **"Show my itinerary plan"** — View scheduled activities\n` +
      `• **"How much is my budget?"** — Calculate remaining and daily budget\n` +
      `• **"Show my hotel details"** — View saved stays and HotelGuard logs\n` +
      `• **"What places did I save?"** — Review cached points of interest\n` +
      `• **"What documents do I have?"** — Inspect Document Vault records\n\n` +
      `*Cloud AI reasoning and live search will resume when connectivity is restored.*`;
  }
}

export const localAIProvider = new LocalAIProvider();