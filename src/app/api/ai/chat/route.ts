import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function handleDeterministicSimulation(lastPrompt: string, tripContext?: any) {
  const query = (lastPrompt || '').toLowerCase();
  const tripName = tripContext?.name || 'your trip';
  const destination = tripContext?.destination || 'your destination';
  const currency = tripContext?.currency || 'USD';
  const currentBudget = tripContext?.budget || 4500;

  const disclaimer = '📡 *[SIMULATED AI ENGINE — Demo Mode (Add `OPENAI_API_KEY` to `.env.local` for live GPT-4o intelligence)]*\n\n';

  // 1. Flight disruption / Delay
  if (query.includes('flight') && (query.includes('delay') || query.includes('late') || query.includes('hours') || query.includes('cancel'))) {
    const delayMatch = query.match(/(\d+)\s*(?:hour|hr|h)/);
    const delayHours = delayMatch ? parseInt(delayMatch[1], 10) : 3;
    const delayMinutes = delayHours * 60;

    return {
      message: `${disclaimer}I have detected your report of an inbound flight delay of **${delayHours} hours** for ${tripName}. I have created a structured disruption proposal so you can inspect the blast radius and review dynamic replan alternatives.`,
      action: {
        type: 'CREATE_DISRUPTION',
        payload: {
          tripId: tripContext?.id,
          type: 'FLIGHT_DELAY',
          title: `Flight Delay (${delayHours}h)`,
          description: `Inbound arrival delayed by ${delayHours} hours (${delayMinutes} min) due to operational variance.`,
          severity: delayHours >= 3 ? 'high' : 'medium',
          delayMinutes,
        },
      },
    };
  }

  // 2. Weather disruption
  if (query.includes('rain') || query.includes('weather') || query.includes('storm') || query.includes('snow')) {
    return {
      message: `${disclaimer}I have noted your report of adverse weather conditions tomorrow for ${destination}. Outdoor exploration will be compromised. I have logged this disruption so you can review indoor alternatives and schedule adjustments.`,
      action: {
        type: 'CREATE_DISRUPTION',
        payload: {
          tripId: tripContext?.id,
          type: 'WEATHER',
          title: 'Adverse Weather Event',
          description: 'Torrential rain forecast impacting outdoor activities.',
          severity: 'medium',
          metadata: { weatherCondition: 'Heavy Rain & Wind' },
        },
      },
    };
  }

  // 3. Venue closure
  if (query.includes('closed') || query.includes('closure') || query.includes('strike')) {
    return {
      message: `${disclaimer}I have recorded the unexpected venue closure report for ${tripName}. Review the disruption card below to trigger impact analysis and reschedule to an open cultural substitute.`,
      action: {
        type: 'CREATE_DISRUPTION',
        payload: {
          tripId: tripContext?.id,
          type: 'VENUE_CLOSED',
          title: 'Attraction / Venue Closure',
          description: 'Scheduled venue temporarily closed for special event / renovation.',
          severity: 'medium',
        },
      },
    };
  }

  // 4. Add to Itinerary / Add Place
  if ((query.includes('add') || query.includes('include') || query.includes('visit')) && (query.includes('day') || query.includes('itinerary') || query.includes('plan'))) {
    const dayMatch = query.match(/day\s*(\d+)/);
    const dayNumber = dayMatch ? parseInt(dayMatch[1], 10) : 2;

    let activityName = 'Sightseeing Highlight';
    if (query.includes('eiffel')) activityName = 'Eiffel Tower';
    else if (query.includes('louvre')) activityName = 'Louvre Museum';
    else if (query.includes('sacre') || query.includes('sacré')) activityName = 'Sacré-Cœur Basilica';
    else if (query.includes('sensoji') || query.includes('temple')) activityName = 'Sensoji Temple';
    else if (query.includes('tower')) activityName = 'Tokyo Tower';
    else if (query.includes('museum')) activityName = 'National Art Museum';
    else {
      const words = lastPrompt.replace(/(add|to|day\s*\d+|itinerary|please|my|the)/gi, '').trim();
      if (words.length > 2) activityName = words;
    }

    return {
      message: `${disclaimer}I have prepared a proposal to add **${activityName}** to **Day ${dayNumber}** in your itinerary. Please review the schedule diff below and click **Apply Changes** to update your plan and map.`,
      action: {
        type: 'ADD_TO_ITINERARY',
        payload: {
          dayNumber,
          activity: activityName,
          location: `${activityName}, ${destination}`,
          startTime: '14:00',
          endTime: '16:00',
          estimatedCost: 25,
        },
      },
    };
  }

  // 5. Remove from itinerary
  if (query.includes('remove') || query.includes('delete') || query.includes('drop')) {
    const dayMatch = query.match(/day\s*(\d+)/);
    const dayNumber = dayMatch ? parseInt(dayMatch[1], 10) : 1;
    let activityName = 'Activity';
    if (query.includes('louvre')) activityName = 'Louvre';
    else if (query.includes('eiffel')) activityName = 'Eiffel';
    else {
      const words = lastPrompt.replace(/(remove|delete|drop|from|day\s*\d+|itinerary|the)/gi, '').trim();
      if (words) activityName = words;
    }

    return {
      message: `${disclaimer}I have prepared a proposal to remove **${activityName}** from Day ${dayNumber}. This will streamline your schedule and free up travel time.`,
      action: {
        type: 'REMOVE_FROM_ITINERARY',
        payload: {
          dayNumber,
          activityName,
        },
      },
    };
  }

  // 6. Update budget
  if (query.includes('budget')) {
    const amountMatch = query.match(/(?:[\$₹€£]|rs\.?|inr|usd)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|k)?/i);
    let newBudget = currentBudget;
    if (query.includes('2.5 lakh') || query.includes('250000') || query.includes('2,50,000')) {
      newBudget = 250000;
    } else if (query.includes('2 lakh') || query.includes('200000') || query.includes('2,00,000')) {
      newBudget = 200000;
    } else if (amountMatch) {
      const parsed = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (query.includes('lakh')) {
        newBudget = parsed * 100000;
      } else if (query.includes('k')) {
        newBudget = parsed * 1000;
      } else if (parsed > 0) {
        newBudget = parsed;
      }
    }

    return {
      message: `${disclaimer}I have analyzed your target budget adjustment. Proposing to update the total budget for **${tripName}** to **$${newBudget.toLocaleString()} ${currency}**. Deterministic category allocations will be recalculated.`,
      action: {
        type: 'UPDATE_TRIP_BUDGET',
        payload: {
          amount: newBudget,
          currency,
        },
      },
    };
  }

  // 7. Spending / Expenses inquiry
  if (query.includes('spent') || query.includes('spending') || query.includes('cost') || query.includes('how much')) {
    const totalSpent = tripContext?.expensesSummary?.totalSpent || 0;
    const remaining = Math.max(0, currentBudget - totalSpent);
    return {
      message: `${disclaimer}**Financial Summary for ${tripName}:**\n\n` +
        `• **Target Budget:** $${currentBudget.toLocaleString()} ${currency}\n` +
        `• **Total Spent:** $${totalSpent.toLocaleString()} ${currency}\n` +
        `• **Remaining Balance:** $${remaining.toLocaleString()} ${currency} (${((remaining / currentBudget) * 100).toFixed(1)}% remaining)\n\n` +
        `*To log new transactions or convert foreign currencies, visit the **Expenses** tab.*`,
      action: { type: 'GENERAL_RESPONSE', payload: {} },
    };
  }

  // 8. Documents inquiry
  if (query.includes('document') || query.includes('passport') || query.includes('vault') || query.includes('visa')) {
    return {
      message: `${disclaimer}I have checked your trip Document Vault metadata. In accordance with Privacy Sentinel safeguards, raw file contents are never transmitted to cloud AI. You have active documents safely tracked with local PII masking.`,
      action: { type: 'LIST_TRIP_DOCUMENTS', payload: {} },
    };
  }

  // 9. Best areas to stay
  if (query.includes('stay') || query.includes('hotel') || query.includes('area') || query.includes('neighborhood')) {
    return {
      message: `${disclaimer}**Top Recommended Areas to Stay in ${destination}:**\n\n` +
        `• **Central District / Historic Center** — Best for first-time visitors with walking access to prime landmarks.\n` +
        `• **Arts & Cultural Quarter** — Ideal for boutique stays, trendy dining, and evening ambiance.\n` +
        `• **Transit Hub Neighborhood** — Best for early flight or rail connections with great budget options.\n\n` +
        `*Browse verified accommodations and compare estimated nightly rates in the **Explore → Stays** tab.*`,
      action: { type: 'GENERAL_RESPONSE', payload: {} },
    };
  }

  // 10. General plan proposal
  return {
    message: `${disclaimer}I am ready to assist with **${tripName}** in **${destination}**. You can ask me to:\n\n` +
      `• *"Add Eiffel Tower to Day 2"*\n` +
      `• *"My flight is delayed by 3 hours. Replan today."*\n` +
      `• *"It is raining tomorrow. Change tomorrow's plan."*\n` +
      `• *"Update budget to $5,000"*\n` +
      `• *"How much have I spent?"*\n` +
      `• *"What are the best areas to stay?"*`,
    action: { type: 'GENERAL_RESPONSE', payload: {} },
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [], tripContext } = body;
    const lastUserPrompt = messages.slice().reverse().find((m: any) => m.role === 'user')?.content || '';

    const apiKey = process.env.OPENAI_API_KEY;

    // Graceful fallback to deterministic engine if API key is not configured
    if (!apiKey || apiKey.trim() === '') {
      const fallbackResult = handleDeterministicSimulation(lastUserPrompt, tripContext);
      return NextResponse.json(fallbackResult);
    }

    const systemPrompt = `You are TravelShield AI — an intelligent, security-first travel companion (Tagline: "Protect. Prove. Adapt.").
You assist travelers by interpreting natural language prompts, building itineraries, analyzing travel budgets, and proposing structured trip workspace updates.

CURRENT TRIP CONTEXT:
${tripContext ? JSON.stringify(tripContext, null, 2) : 'No active trip selected.'}

CRITICAL DATA TRUST & SAFETY RULES:
1. Do NOT claim to provide real-time live flight prices, live weather, or current hotel availability. Clearly state general travel estimates when asked.
2. If essential information is missing when asked to plan a trip (e.g. missing dates, origin, or budget), choose action "ASK_CLARIFICATION" and ask the user for the missing fields.
3. If the user asks to modify their trip (e.g. "Change budget to $3000", "Make it 10 days", "Change style to luxury", "Add beaches to interests"), output a structured action.
4. Allowed Action Types:
   - "CREATE_TRIP": payload { "name": string, "destination": string, "origin": string, "startDate": string, "endDate": string, "travelers": number, "budget": number, "currency": string, "travelStyle": string, "interests": string[] }
   - "UPDATE_TRIP": payload { "name"?: string, "destination"?: string, "origin"?: string, "startDate"?: string, "endDate"?: string, "travelers"?: number, "travelStyle"?: string, "interests"?: string[] }
   - "CREATE_ITINERARY": payload { "summary": string, "days": Array<{ "dayNumber": number, "title": string, "activities": string[] }> }
   - "ADD_TO_ITINERARY": payload { "dayNumber": number, "activity": string, "location"?: string, "startTime"?: string, "endTime"?: string, "estimatedCost"?: number }
   - "REMOVE_FROM_ITINERARY": payload { "dayNumber": number, "activityName": string }
   - "UPDATE_BUDGET": payload { "amount": number, "currency"?: string }
   - "ADD_EXPENSE": payload { "title": string, "amount": number, "category": string }
   - "REPLAN_TRIP": payload { "reason": string }
   - "UPDATE_TRIP_BUDGET": payload { "amount": number, "currency": string }
   - "UPDATE_TRIP_DETAILS": payload { "name"?: string, "destination"?: string, "origin"?: string, "startDate"?: string, "endDate"?: string, "travelers"?: number, "travelStyle"?: string, "interests"?: string[] }
   - "SAVE_PLACE": payload { "name": string, "category": string, "description"?: string, "address"?: string, "estimatedCost"?: number }
   - "SAVE_STAY": payload { "name": string, "location"?: string, "estimatedPricePerNight"?: number }
   - "ADD_PLACE_TO_ITINERARY": payload { "name": string, "dayNumber": number, "startTime"?: string }
   - "ADD_STAY_COST_TO_BUDGET": payload { "name": string, "amount": number }
   - "OPTIMIZE_ROUTE": payload { "dayNumber": number }
   - "REORDER_ITINERARY_DAY": payload { "dayNumber": number, "orderedItemIds": string[] }
   - "CREATE_DISRUPTION": payload { "type": string, "title": string, "description": string, "severity": string, "delayMinutes"?: number }
   - "APPLY_REPLAN": payload { "option": object }
   - "LIST_TRIP_DOCUMENTS": payload {}
   - "ASK_CLARIFICATION": payload { "missingFields": string[] }
   - "GENERAL_RESPONSE": payload {}

REQUIRED OUTPUT FORMAT:
You MUST respond with a strictly valid JSON object matching:
{
  "message": "Your conversational answer to the user",
  "action": {
    "type": "ACTION_TYPE_HERE",
    "payload": { ... }
  }
}`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openAiResponse.ok) {
      console.warn('OpenAI API returned status', openAiResponse.status, 'Falling back to deterministic engine');
      const fallbackResult = handleDeterministicSimulation(lastUserPrompt, tripContext);
      return NextResponse.json(fallbackResult);
    }

    const aiData = await openAiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) {
      const fallbackResult = handleDeterministicSimulation(lastUserPrompt, tripContext);
      return NextResponse.json(fallbackResult);
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(rawContent);
    } catch {
      parsedContent = {
        message: rawContent,
        action: { type: 'GENERAL_RESPONSE', payload: {} },
      };
    }

    return NextResponse.json({
      message: parsedContent.message || 'I have analyzed your request.',
      action: parsedContent.action || { type: 'GENERAL_RESPONSE', payload: {} },
    });
  } catch (err: any) {
    console.error('Server AI Chat API route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error in AI route.' },
      { status: 500 }
    );
  }
}
