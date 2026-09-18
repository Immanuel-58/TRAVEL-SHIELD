'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useTrip } from '@/context/TripContext';
import { extractTripContext } from '@/services/ai/tripContext';
import { cloudAIProvider } from '@/services/ai/CloudAIProvider';
import { localAIProvider } from '@/services/ai/LocalAIProvider';
import { useOffline } from '@/context/OfflineContext';
import { processAIResponse } from '@/services/ai/pipeline';
import { ChatMessage, ActionProposal } from '@/services/ai/types';
import { placesProvider } from '@/services/explore/PlacesProvider';
import { voiceProvider } from '@/services/device/VoiceProvider';
import { OfflineIntentParser } from '@/services/ai/OfflineIntentParser';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Bot, 
  User, 
  Compass, 
  Wallet, 
  Calendar, 
  Sliders, 
  Tag, 
  Trash2,
  WifiOff,
  CloudRain,
  Mic,
  MicOff
} from 'lucide-react';
import { RouteService } from '@/services/map/RouteService';

export default function TripAssistantPage({ params }: { params: Promise<{ tripId: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.tripId;
  const { 
    getTripById, 
    updateTrip, 
    updateTripBudget, 
    addItineraryItem, 
    removeItineraryItem, 
    addExpense, 
    replanItinerary,
    savePlace,
    saveStay,
    addPlaceToItinerary,
    addStayCostToBudget,
    reorderItineraryDay,
    reportDisruption,
    applyReplanOption,
  } = useTrip();
  const trip = getTripById(tripId);
  const { isOffline } = useOffline();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);

  const handleToggleVoice = async () => {
    if (isListening) {
      voiceProvider.stopListening();
      setIsListening(false);
      setVoiceStatus(null);
      return;
    }

    const avail = await voiceProvider.checkAvailability();
    if (!avail.isAvailable) {
      setVoiceStatus(avail.disclaimer);
      return;
    }

    setIsListening(true);
    setVoiceStatus('Listening via on-device speech engine... Speak now.');
    voiceProvider.startListening({
      onResult: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) {
          setIsListening(false);
          setVoiceStatus(null);
          handleSendMessage(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceStatus('Voice error: ' + err);
      },
      onEnd: () => {
        setIsListening(false);
        setVoiceStatus(null);
      },
    });
  };
  const [isSending, setIsSending] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `travelshield_chat_${tripId}`;

  // Load conversation history from localStorage
  useEffect(() => {
    if (!tripId) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else if (trip) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-msg',
          role: 'assistant',
          content: `Hello! I am your TravelShield AI assistant for **"${trip.name}"**.\n\nI have loaded your trip parameters (${trip.destination}, ${trip.startDate} → ${trip.endDate}, ${trip.travelers} traveler(s), Target Budget: $${trip.budget.toLocaleString()} ${trip.currency}).\n\nHow can I help you plan, optimize your budget, or update your trip schedule today?`,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }, [tripId, trip, storageKey]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Save chat history to localStorage
  const saveMessages = (updated: ChatMessage[]) => {
    setMessages(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear chat history for this trip?')) {
      localStorage.removeItem(storageKey);
      if (trip) {
        const welcome: ChatMessage = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `Conversation reset. Ready to assist with **"${trip.name}"**.`,
          timestamp: new Date().toISOString(),
        };
        saveMessages([welcome]);
      } else {
        setMessages([]);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim() || isSending || !trip) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    saveMessages(updatedMessages);
    if (!textToSend) setInput('');
    setIsSending(true);
    setConfigError(null);

    try {
      if (isOffline) {
        const parsedIntent = OfflineIntentParser.parse(userText, trip);
        if (parsedIntent.matched && parsedIntent.proposal) {
          const aiMessage: ChatMessage = {
            id: 'ai-' + Date.now(),
            role: 'assistant',
            content: parsedIntent.replyText,
            timestamp: new Date().toISOString(),
            proposal: parsedIntent.proposal,
          };
          saveMessages([...updatedMessages, aiMessage]);
          setIsSending(false);
          return;
        }
      }

      const baseContext = extractTripContext(trip);
      // Append document metadata (metadata only — no file contents, no base64)
      const docMetadata = (trip.documents || []).map(d => ({
        id: d.id,
        filename: d.filename,
        docType: d.docType,
        privacyStatus: d.privacyStatus,
        uploadedAt: d.uploadedAt,
      }));
      const context = {
        ...baseContext,
        documents: docMetadata,
        itineraryDays: trip.itineraryDays,
        savedPlaces: trip.savedPlaces,
        savedStays: trip.savedStays,
        hotelGuardSessions: trip.hotelGuardSessions,
        disruptions: trip.disruptions,
        replanHistory: trip.replanHistory,
      };

      const aiRawResponse = isOffline
        ? await localAIProvider.sendMessage(updatedMessages, context)
        : await cloudAIProvider.sendMessage(updatedMessages, context);

      const processed = processAIResponse(aiRawResponse, trip);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: processed.message,
        timestamp: new Date().toISOString(),
        proposal: processed.proposal,
      };

      saveMessages([...updatedMessages, aiMessage]);
    } catch (err: any) {
      console.error('AI Assistant Error:', err);
      const isConfig = err.message?.includes('OPENAI_API_KEY') || err.message?.includes('Configuration Required');

      if (isConfig) {
        setConfigError(err.message);
      }

      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: isConfig
          ? `📡 **OpenAI API Key Unconfigured**\n\n${err.message}\n\nPlease add your \`OPENAI_API_KEY\` to \`.env.local\` to activate live ChatGPT intelligence.`
          : `📡 **AI Service Communication Alert**\n\n${err.message || 'Unable to connect to AI server. Please try again.'}`,
        timestamp: new Date().toISOString(),
        isConfigError: isConfig,
      };

      saveMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyProposal = async (proposal: ActionProposal, messageId: string) => {
    if (!trip) return;

    try {
      const { actionType, payload } = proposal;

      if (actionType === 'UPDATE_BUDGET' || actionType === 'UPDATE_TRIP_BUDGET') {
        updateTripBudget(trip.id, { totalBudget: payload.amount, currency: payload.currency || trip.currency });
      } else if (actionType === 'UPDATE_TRIP' || actionType === 'UPDATE_TRIP_DETAILS') {
        updateTrip(trip.id, payload);
      } else if (actionType === 'SAVE_PLACE') {
        savePlace(trip.id, {
          id: `place-ai-${Date.now()}`,
          name: payload.name || 'Saved Place',
          destination: trip.destination,
          category: payload.category || 'attraction',
          description: payload.description || 'Discovered via AI Assistant',
          address: payload.address || trip.destination,
          estimatedVisitDurationMinutes: 120,
          estimatedCost: { amount: payload.estimatedCost || 0, currency: trip.currency, trustLabel: 'ESTIMATED' },
          source: 'TravelShield AI Assistant',
          trustLabel: 'ESTIMATED',
        });
      } else if (actionType === 'SAVE_STAY') {
        saveStay(trip.id, {
          id: `stay-ai-${Date.now()}`,
          name: payload.name || 'Saved Accommodation',
          destination: trip.destination,
          location: payload.location || trip.destination,
          estimatedPricePerNight: { amount: payload.estimatedPricePerNight || 150, currency: trip.currency, trustLabel: 'ESTIMATED' },
          source: 'TravelShield AI Assistant',
          trustLabel: 'ESTIMATED',
        });
      } else if (actionType === 'ADD_PLACE_TO_ITINERARY') {
        // Geocode place coordinates if known in provider
        const knownPlaces = await placesProvider.searchPlaces(trip.destination, payload.name || payload.place?.name);
        const match = knownPlaces.find(p => p.name.toLowerCase().includes((payload.name || '').toLowerCase()));

        addPlaceToItinerary(
          trip.id,
          {
            id: `place-ai-${Date.now()}`,
            name: payload.name || payload.place?.name || 'Point of Interest',
            destination: trip.destination,
            category: 'attraction',
            description: 'Scheduled via AI Assistant',
            address: match?.address || trip.destination,
            coordinates: match?.coordinates,
            estimatedVisitDurationMinutes: 120,
            estimatedCost: { amount: payload.estimatedCost || 0, currency: trip.currency, trustLabel: 'ESTIMATED' },
            source: 'TravelShield AI Assistant',
            trustLabel: 'ESTIMATED',
          },
          payload.dayNumber || 1,
          payload.startTime || '10:00'
        );
      } else if (actionType === 'ADD_STAY_COST_TO_BUDGET') {
        addStayCostToBudget(
          trip.id,
          {
            id: `stay-ai-${Date.now()}`,
            name: payload.name || payload.stay?.name || 'Accommodation Stay',
            destination: trip.destination,
            location: trip.destination,
            estimatedPricePerNight: { amount: payload.amount || 150, currency: trip.currency, trustLabel: 'ESTIMATED' },
            source: 'TravelShield AI Assistant',
            trustLabel: 'ESTIMATED',
          },
          payload.nights || 1
        );
      } else if (actionType === 'ADD_TO_ITINERARY') {
        const knownPlaces = await placesProvider.searchPlaces(trip.destination, payload.activity);
        const match = knownPlaces.find(p => p.name.toLowerCase().includes((payload.activity || '').toLowerCase()));

        addItineraryItem(trip.id, {
          dayNumber: payload.dayNumber || 1,
          date: payload.date || trip.startDate,
          activity: payload.activity || 'New Activity',
          location: payload.location || match?.address || trip.destination,
          coordinates: match?.coordinates,
          locationTrustLabel: match?.coordinates ? 'ESTIMATED' : undefined,
          startTime: payload.startTime || '10:00',
          endTime: payload.endTime || '11:30',
          durationMinutes: 90,
          estimatedCost: {
            amount: payload.estimatedCost || 0,
            currency: trip.currency,
            trustLabel: 'ESTIMATED',
          },
          travelTimeMinutes: 15,
          status: 'planned',
        });
      } else if (actionType === 'REMOVE_FROM_ITINERARY') {
        removeItineraryItem(trip.id, payload.dayNumber || 1, payload.itemId || payload.activityName || '');
      } else if (actionType === 'ADD_EXPENSE') {
        addExpense(trip.id, payload.category || 'miscellaneous', payload.amount || 0, payload.title || 'Expense Entry');
      } else if (actionType === 'CREATE_DISRUPTION') {
        reportDisruption(trip.id, {
          id: `disrupt-ai-${Date.now()}`,
          tripId: trip.id,
          type: payload.type || 'OTHER',
          title: payload.title || 'Reported Disruption',
          description: payload.description || 'Reported via TravelShield AI Assistant',
          severity: payload.severity || 'medium',
          source: 'user_reported',
          status: 'active',
          detectedAt: new Date().toISOString(),
          metadata: payload.metadata || (payload.delayMinutes ? { delayMinutes: payload.delayMinutes } : undefined),
          affectedDate: payload.affectedDate || trip.startDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (actionType === 'APPLY_REPLAN') {
        if (payload.option) {
          applyReplanOption(trip.id, payload.option);
        }
      } else if (actionType === 'REPLAN_TRIP' || actionType === 'CREATE_ITINERARY' || actionType === 'GENERATE_INITIAL_ITINERARY') {
        if (Array.isArray(payload.days)) {
          const formattedDays = payload.days.map((d: any, idx: number) => {
            const dayNum = d.dayNumber || idx + 1;
            const items = (d.activities || []).map((actName: any, actIdx: number) => ({
              id: `item-${dayNum}-${actIdx + 1}`,
              dayNumber: dayNum,
              date: trip.startDate,
              activity: typeof actName === 'string' ? actName : (actName?.activity || 'Planned Sightseeing'),
              location: trip.destination,
              startTime: '10:00',
              endTime: '12:00',
              durationMinutes: 120,
              estimatedCost: { amount: 30, currency: trip.currency, trustLabel: 'ESTIMATED' as const },
              travelTimeMinutes: 15,
              status: 'planned' as const,
            }));
            return {
              dayNumber: dayNum,
              date: trip.startDate,
              items,
            };
          });
          replanItinerary(trip.id, formattedDays);
        } else {
          import('@/services/travel/PlanningService').then(({ PlanningService }) => {
            const plan = PlanningService.generateInitialTripPlan(trip);
            replanItinerary(trip.id, plan.itineraryDays);
          });
        }
      } else if (actionType === 'OPTIMIZE_ROUTE') {
        const dayNum = payload.dayNumber || 1;
        const targetDay = (trip.itineraryDays || []).find(d => d.dayNumber === dayNum);
        if (targetDay && targetDay.items && targetDay.items.length > 0) {
          const optimization = RouteService.optimizeDayItemSequence(targetDay.items);
          const orderedIds = optimization.optimizedItems.map(i => i.id);
          reorderItineraryDay(trip.id, dayNum, orderedIds);
        }
      } else if (actionType === 'REORDER_ITINERARY_DAY') {
        const dayNum = payload.dayNumber || 1;
        const orderedIds = payload.orderedItemIds || [];
        if (orderedIds.length > 0) {
          reorderItineraryDay(trip.id, dayNum, orderedIds);
        }
      } else if (actionType === 'LIST_TRIP_DOCUMENTS') {
        // INFO-ONLY: no state changes.
      }

      // Mark proposal status as applied in message state
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId && msg.proposal) {
          return {
            ...msg,
            proposal: { ...msg.proposal, status: 'applied' as const },
          };
        }
        return msg;
      });

      saveMessages(updatedMessages);
    } catch (err) {
      console.error('Failed to apply proposal:', err);
      alert('Error applying trip modification.');
    }
  };

  const handleDismissProposal = (messageId: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId && msg.proposal) {
        return {
          ...msg,
          proposal: { ...msg.proposal, status: 'dismissed' as const },
        };
      }
      return msg;
    });
    saveMessages(updatedMessages);
  };

  if (!trip) return null;

  const quickActions = [
    { label: 'Plan entire trip', text: `Plan my entire ${trip.destination} trip for ${trip.travelers} traveler(s) under $${trip.budget} ${trip.currency}.`, icon: <Compass size={14} /> },
    { label: 'Add Eiffel Tower to Day 2', text: 'Add Eiffel Tower to Day 2 in the afternoon.', icon: <Sparkles size={14} /> },
    { label: '3h Flight Delay', text: 'My flight is delayed by 3 hours. Replan today.', icon: <AlertTriangle size={14} /> },
    { label: 'Raining Tomorrow', text: 'It is raining tomorrow. Change tomorrow\'s plan.', icon: <CloudRain size={14} /> },
    { label: 'Update budget to $5,000', text: 'Change my trip budget to $5000 USD.', icon: <Wallet size={14} /> },
    { label: 'How much spent?', text: 'How much have I spent so far against my trip budget?', icon: <Wallet size={14} /> },
    { label: 'Make trip 10 days', text: 'Update my trip end date so the total duration is 10 days.', icon: <Calendar size={14} /> },
    { label: 'Set luxury style', text: 'Change my travel style to luxury.', icon: <Sliders size={14} /> },
    { label: 'Add beaches to interests', text: 'Add beaches & relaxation to my trip interests.', icon: <Tag size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 'calc(100vh - 220px)' }}>
      {/* Top Banner Context Card */}
      <Card style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--color-accent, #b5541a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
                TravelShield AI Companion
              </h2>
              <Badge variant="cyan">{isOffline ? 'Deterministic Engine (Offline)' : 'Cloud AI (GPT-4o-mini / Fallback)'}</Badge>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '2px' }}>
              Active Context: <strong style={{ color: 'var(--color-text-primary, #1c1410)' }}>{trip.name}</strong> ({trip.destination} • {trip.startDate} → {trip.endDate} • Budget: ${trip.budget.toLocaleString()} {trip.currency})
            </p>
          </div>
        </div>

        <Button variant="secondary" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleClearChat}>
          Clear Chat
        </Button>
      </Card>

      {/* Configuration Alert Box (Shown when OPENAI_API_KEY is missing) */}
      {configError && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: 'var(--color-text-primary, #1c1410)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
        }}>
          <AlertTriangle size={24} color="var(--color-warning, #b87020)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-warning, #b87020)' }}>
              OpenAI API Key Missing Server-Side
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary, #6b5c4e)', marginTop: '4px', lineHeight: 1.5 }}>
              To activate live ChatGPT travel intelligence, add <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-accent, #b5541a)' }}>OPENAI_API_KEY=your_key</code> to your server-side <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-accent, #b5541a)' }}>.env.local</code> file and restart the dev server.
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Messages Container */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '420px', maxHeight: '560px', overflowY: 'auto', padding: '20px' }}>
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {/* Message Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted, #9a8a7c)', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                {!isUser && <Bot size={14} color="var(--color-accent, #b5541a)" />}
                <span style={{ fontWeight: 600, color: isUser ? 'var(--color-accent, #b5541a)' : 'var(--color-text-primary, #1c1410)' }}>
                  {isUser ? 'Traveler' : 'TravelShield AI'}
                </span>
                <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isUser && <User size={14} color="var(--color-accent, #b5541a)" />}
              </div>

              {/* Message Content Bubble */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: isUser
                    ? 'rgba(181, 84, 26, 0.08)'
                    : msg.isConfigError
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'var(--color-surface, #ffffff)',
                  border: isUser
                    ? '1px solid rgba(181, 84, 26, 0.25)'
                    : msg.isConfigError
                    ? '1px solid rgba(245, 158, 11, 0.3)'
                    : '1px solid var(--color-border, #e0d5c8)',
                  color: 'var(--color-text-primary, #1c1410)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
                }}
              >
                {msg.content}
              </div>

              {/* Interactive Action Proposal Card (If AI returned a structured action) */}
              {msg.proposal && (
                <div style={{
                  marginTop: '6px',
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--color-surface-muted, #f4f0ea)',
                  border: msg.proposal.status === 'applied'
                    ? '1px solid var(--color-success, #2d6a4f)'
                    : msg.proposal.status === 'dismissed'
                    ? '1px solid var(--color-border, #e0d5c8)'
                    : '1px solid var(--color-accent, #b5541a)',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={15} color="var(--color-accent, #b5541a)" /> {msg.proposal.title}
                    </div>

                    {msg.proposal.status === 'applied' && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-success, #2d6a4f)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> APPLIED TO WORKSPACE
                      </span>
                    )}

                    {msg.proposal.status === 'dismissed' && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #9a8a7c)', fontWeight: 600 }}>
                        DISMISSED
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b5c4e)', marginBottom: '12px' }}>
                    {msg.proposal.description}
                  </p>

                  {/* Diff Table */}
                  {msg.proposal.diffSummary.length > 0 && (
                    <div style={{ background: 'var(--color-surface, #ffffff)', padding: '10px', borderRadius: '6px', marginBottom: '14px', border: '1px solid var(--color-border, #e0d5c8)' }}>
                      {msg.proposal.diffSummary.map((diff, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0' }}>
                          <span style={{ color: 'var(--color-text-secondary, #6b5c4e)' }}>{diff.field}:</span>
                          <span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--color-error, #b91c1c)', marginRight: '8px' }}>{String(diff.oldValue)}</span>
                            <span style={{ color: 'var(--color-success, #2d6a4f)', fontWeight: 600 }}>→ {String(diff.newValue)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {msg.proposal.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<XCircle size={14} />}
                        onClick={() => handleDismissProposal(msg.id)}
                      >
                        Dismiss
                      </Button>

                      <Button
                        size="sm"
                        leftIcon={<CheckCircle2 size={14} />}
                        onClick={() => handleApplyProposal(msg.proposal!, msg.id)}
                      >
                        Apply Changes
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isSending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-accent, #b5541a)', fontSize: '0.85rem', padding: '12px' }}>
            <Sparkles size={16} className="animate-spin" />
            <span>TravelShield AI is analyzing trip context and validating structured actions...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </Card>

      {/* Quick Action Prompt Pills */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted, #9a8a7c)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Suggested Prompt Actions
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(qa.text)}
              disabled={isSending}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #e0d5c8)',
                color: 'var(--color-text-primary, #1c1410)',
                fontSize: '0.8rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSending ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ color: 'var(--color-accent, #b5541a)' }}>{qa.icon}</span>
              <span>{qa.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isOffline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'var(--color-warning-soft, #fdf0d8)',
          border: '1px solid rgba(184, 112, 32, 0.25)',
          color: 'var(--color-warning, #b87020)',
          fontSize: '0.8rem',
        }}>
          <WifiOff size={14} />
          <span>
            <strong>Offline Mode:</strong> Prompts are handled locally on this device via the Deterministic Travel Engine. Cloud AI is not contacted.
          </span>
        </div>
      )}

      {/* Chat Input Bar */}
      {voiceStatus && (
        <div style={{
          marginBottom: '8px', padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem',
          background: isListening ? 'var(--color-danger-soft, #fce8e8)' : 'var(--color-surface-muted, #f4f0ea)',
          color: isListening ? 'var(--color-danger, #a82020)' : 'var(--color-text-secondary, #6b5c4e)',
          display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--color-border, #e0d5c8)',
        }}>
          <Mic size={14} className={isListening ? 'animate-pulse' : ''} />
          <span>{voiceStatus}</span>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={handleToggleVoice}
          title="Voice Assistant (Web Speech API)"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px',
            borderRadius: 'var(--radius-md)', background: isListening ? 'var(--color-danger, #a82020)' : 'var(--color-surface-muted, #f4f0ea)',
            color: isListening ? '#ffffff' : 'var(--color-text-primary, #1c1410)',
            border: isListening ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isOffline ? `Ask local engine about "${trip.name}" (itinerary, budget, hotel, docs)...` : `Ask AI to plan, update budget, or modify parameters for "${trip.name}"...`}
          disabled={isSending}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e0d5c8)',
            color: 'var(--color-text-primary, #1c1410)',
            fontSize: '0.9rem',
            outline: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
        <Button
          type="submit"
          isLoading={isSending}
          disabled={!input.trim() || isSending}
          leftIcon={<Send size={16} />}
        >
          Send Prompt
        </Button>
      </form>
    </div>
  );
}
