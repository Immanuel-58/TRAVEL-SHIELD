'use client';

import React, { useState } from 'react';
import { useTrip } from '@/context/TripContext';
import { Sparkles, Send, ShieldCheck, Cpu } from 'lucide-react';

export function AIAssistantSection() {
  const { activeTrip } = useTrip();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; trustLabel?: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your TravelShield AI assistant for "${activeTrip?.name}". How can I assist with your planning, budget analysis, or itinerary updates today?`,
      trustLabel: 'ESTIMATED'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `AI Travel Analysis for "${userMsg}":\n\nI have parsed your request. In accordance with Rule #6 (AI Safety & Data Trust), I will prepare a structured action for your review before modifying persistent trip data.\n\nProposed Action: Check flight schedules & recalculate remaining budget ($2,150 available).`,
          trustLabel: 'ESTIMATED'
        }
      ]);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '16px' }}>
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            AI Travel Assistant
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Architecture Safeguard: AI generates structured recommendations. Deterministic engines calculate and validate.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', border: '1px solid var(--border-active)' }}>
            CloudAIProvider Active
          </span>
          <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            LocalAI Fallback Ready
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="glass-panel" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)' : 'rgba(255, 255, 255, 0.04)',
              border: msg.sender === 'user' ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
              color: '#ffffff',
              whiteSpace: 'pre-wrap'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span>{msg.sender === 'user' ? 'Traveler' : 'TravelShield AI'}</span>
              {msg.trustLabel && (
                <span className={`badge-trust badge-trust-${msg.trustLabel.toLowerCase()}`}>
                  {msg.trustLabel}
                </span>
              )}
            </div>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to plan activities, research flights, or optimize budget..."
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(18, 24, 36, 0.8)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '14px 24px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
            color: '#ffffff',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send size={16} /> Send
        </button>
      </form>
    </div>
  );
}
