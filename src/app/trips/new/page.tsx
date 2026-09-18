'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrip } from '@/context/TripContext';
import { validateTripForm, calculateDurationDays } from '@/utils/validation';
import { TripFormData, FormErrors } from '@/types/trip';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Luggage, Calendar, MapPin, Wallet, Sparkles } from 'lucide-react';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
];

const STYLE_OPTIONS = [
  { value: 'balanced', label: 'Balanced (Mix of comfort & local sights)' },
  { value: 'budget', label: 'Budget-Conscious (Max value & hostels/trains)' },
  { value: 'luxury', label: 'Luxury & Comfort (5-star stays & private tours)' },
  { value: 'adventure', label: 'High Adventure & Outdoor Exploration' },
];

const INTEREST_TAGS = [
  'Culture & History',
  'Food & Dining',
  'Nature & Parks',
  'Museums & Art',
  'Shopping',
  'Nightlife',
  'Relaxation & Spa',
  'Technology & Innovation'
];

export default function CreateTripPage() {
  const router = useRouter();
  const { createTrip } = useTrip();

  const [formData, setFormData] = useState<TripFormData>({
    name: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: 2500,
    currency: 'USD',
    travelStyle: 'balanced',
    interests: ['Culture & History', 'Food & Dining'],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationDays = calculateDurationDays(formData.startDate, formData.endDate);

  const handleChange = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for that field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleInterest = (tag: string) => {
    setFormData(prev => {
      const exists = prev.interests.includes(tag);
      return {
        ...prev,
        interests: exists ? prev.interests.filter(i => i !== tag) : [...prev.interests, tag]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTripForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = createTrip(formData);
      router.push(`/trips/${created.id}/overview`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Link */}
      <div>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
          Create New Trip Workspace
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Define your destination, travel window, and budget limits to establish your central Trip.
        </p>
      </div>

      {/* Form Container */}
      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Trip Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              1. Basic Trip Identity
            </h3>

            <Input
              label="Trip Name"
              requiredField
              placeholder="e.g. Paris Cyber Expedition 2026"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              helperText="Give your trip workspace a descriptive name."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="mobile-single-col">
              <Input
                label="Origin City / Airport"
                requiredField
                placeholder="e.g. New York (JFK)"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                error={errors.origin}
              />

              <Input
                label="Destination City / Country"
                requiredField
                placeholder="e.g. Paris, France"
                value={formData.destination}
                onChange={(e) => handleChange('destination', e.target.value)}
                error={errors.destination}
              />
            </div>
          </div>

          {/* Section 2: Dates & Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                2. Schedule & Travelers
              </h3>
              {durationDays > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  Calculated Duration: {durationDays} Days
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="mobile-single-col">
              <Input
                type="date"
                label="Start Date"
                requiredField
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                error={errors.startDate}
              />

              <Input
                type="date"
                label="End Date"
                requiredField
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={errors.endDate}
              />

              <Input
                type="number"
                min={1}
                max={50}
                label="Travelers"
                requiredField
                value={formData.travelers}
                onChange={(e) => handleChange('travelers', parseInt(e.target.value) || 1)}
                error={errors.travelers}
              />
            </div>
          </div>

          {/* Section 3: Budget & Currency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-amber)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              3. Target Budget Configuration
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }} className="mobile-single-col">
              <Input
                type="number"
                step="50"
                min="0"
                label="Target Budget"
                placeholder="2500"
                value={formData.budget}
                onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
                error={errors.budget}
                helperText="Deterministic calculations will track expenses against this limit."
              />

              <Select
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                error={errors.currency}
              />
            </div>
          </div>

          {/* Section 4: Travel Style & Preferences */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              4. Travel Preferences
            </h3>

            <Select
              label="Travel Style"
              options={STYLE_OPTIONS}
              value={formData.travelStyle}
              onChange={(e) => handleChange('travelStyle', e.target.value)}
            />

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Trip Interests & Focus
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {INTEREST_TAGS.map((tag) => {
                  const selected = formData.interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: selected ? 600 : 400,
                        color: selected ? '#ffffff' : 'var(--text-secondary)',
                        background: selected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: selected ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {selected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Luggage size={16} />}
            >
              Create Trip Workspace
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
