'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { TravelEngine } from '@/services/travel/TravelEngine';
import { RouteService } from '@/services/map/RouteService';
import { ItineraryItem } from '@/types/travel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign,
  Info
} from 'lucide-react';

export function ItinerarySection({ tripId }: { tripId?: string }) {
  const { activeTrip, getTripById, addItineraryItem, removeItineraryItem, updateItineraryItem } = useTrip();
  const trip = tripId ? getTripById(tripId) : activeTrip;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form states for Add Activity
  const [targetDay, setTargetDay] = useState(1);
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [cost, setCost] = useState('25');
  const [notes, setNotes] = useState('');

  // Form states for Edit Activity
  const [editItemId, setEditItemId] = useState('');
  const [editDayNumber, setEditDayNumber] = useState(1);

  if (!trip) return null;

  const days = trip.itineraryDays || [];
  const totalItems = days.reduce((sum, d) => sum + (d.items?.length || 0), 0);
  const durationDays = TravelEngine.calculateTripDuration(trip.startDate, trip.endDate) || days.length || 7;

  // Run deterministic validation
  const validationResult = TravelEngine.validateItinerarySchedule(days, trip.startDate, trip.endDate);

  const handleOpenAddModal = (dayNum = 1) => {
    setTargetDay(dayNum);
    setActivity('');
    setLocation(trip.destination || '');
    setStartTime('10:00');
    setEndTime('12:00');
    setCost('30');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    addItineraryItem(trip.id, {
      dayNumber: Number(targetDay),
      date: trip.startDate,
      activity: activity.trim(),
      location: location.trim() || trip.destination,
      startTime,
      endTime,
      durationMinutes: 120,
      estimatedCost: {
        amount: parseFloat(cost) || 0,
        currency: trip.currency,
        trustLabel: 'USER_ENTERED',
      },
      travelTimeMinutes: 15,
      notes: notes.trim(),
      status: 'planned',
    });

    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (dayNum: number, item: ItineraryItem) => {
    setEditItemId(item.id);
    setEditDayNumber(dayNum);
    setActivity(item.activity);
    setLocation(item.location || '');
    setStartTime(item.startTime || '10:00');
    setEndTime(item.endTime || '12:00');
    setCost(String(item.estimatedCost?.amount || 0));
    setNotes(item.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim() || !editItemId) return;

    updateItineraryItem(trip.id, editDayNumber, editItemId, {
      activity: activity.trim(),
      location: location.trim(),
      startTime,
      endTime,
      estimatedCost: {
        amount: parseFloat(cost) || 0,
        currency: trip.currency,
        trustLabel: 'USER_ENTERED',
      },
      notes: notes.trim(),
    });

    setIsEditModalOpen(false);
  };

  const handleRemoveActivity = (dayNum: number, itemId: string) => {
    if (confirm('Are you sure you want to remove this activity?')) {
      removeItineraryItem(trip.id, dayNum, itemId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header bar */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} color="var(--accent-emerald)" />
            Deterministic Itinerary Schedule ({durationDays} Days, {totalItems} Activities)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Schedule overlaps, negative costs, and missing parameters are validated deterministically by TravelEngine.
          </p>
        </div>

        <Button leftIcon={<Plus size={16} />} onClick={() => handleOpenAddModal(1)}>
          Add Activity
        </Button>
      </div>

      {/* Live Validation Alerts Banner */}
      {validationResult.warnings.length > 0 && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: 'var(--color-text-primary, #1c1410)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Deterministic Schedule Warnings ({validationResult.warnings.length})
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {validationResult.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Days Breakdown List */}
      {days.length === 0 ? (
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No itinerary days created yet.</p>
          <Button style={{ marginTop: '16px' }} onClick={() => handleOpenAddModal(1)}>
            Add First Activity
          </Button>
        </Card>
      ) : (
        days.map((day) => {
          const dayRoute = RouteService.compileDayRoute(day.items, day.dayNumber);

          return (
            <Card key={day.dayNumber} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarDays size={18} color="var(--accent-cyan)" /> Day {day.dayNumber}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>• {day.date}</span>
                    {dayRoute.totalDistanceKm > 0 && (
                      <Badge variant="neutral" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                        {dayRoute.totalDistanceKm} km route (~{dayRoute.totalTravelTimeMinutes}m)
                      </Badge>
                    )}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/trips/${trip.id}/map?day=${day.dayNumber}`} style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="outline" leftIcon={<MapPin size={14} color="var(--accent-cyan)" />}>
                      View Map
                    </Button>
                  </Link>
                  <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={() => handleOpenAddModal(day.dayNumber)}>
                    Add Activity
                  </Button>
                </div>
              </div>

              {/* Day Route Warnings */}
              {dayRoute.warnings.length > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '14px', fontSize: '0.78rem', color: 'var(--accent-amber)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayRoute.warnings.map((w, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={13} /> {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Items for this day */}
              {day.items.length === 0 ? (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                  No activities scheduled for Day {day.dayNumber}. Click &quot;Add Activity&quot; to plan your day.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {day.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary, #1c1410)' }}>
                            {item.activity}
                          </span>
                          <Badge variant="cyan" style={{ fontSize: '0.72rem' }}>
                            <Clock size={12} style={{ marginRight: '4px' }} /> {item.startTime} - {item.endTime}
                          </Badge>
                          {item.estimatedCost && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                              ${item.estimatedCost.amount} {item.estimatedCost.currency}
                            </span>
                          )}
                          {item.locationTrustLabel && (
                            <span className={`badge-trust badge-trust-${item.locationTrustLabel.toLowerCase()}`} style={{ fontSize: '0.64rem' }}>
                              {item.locationTrustLabel}
                            </span>
                          )}
                        </div>

                        {item.location && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                            <MapPin size={13} color="var(--accent-cyan)" /> {item.location}
                          </div>
                        )}

                        {item.notes && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {item.coordinates && (
                          <Link href={`/trips/${trip.id}/map?day=${day.dayNumber}&itemId=${item.id}`} style={{ textDecoration: 'none' }}>
                            <Button size="sm" variant="ghost" leftIcon={<MapPin size={14} color="var(--accent-cyan)" />}>Map</Button>
                          </Link>
                        )}
                        <Button size="sm" variant="ghost" leftIcon={<Edit3 size={14} />} onClick={() => handleOpenEditModal(day.dayNumber, item)}>Edit</Button>
                        <Button size="sm" variant="ghost" leftIcon={<Trash2 size={14} color="var(--accent-rose)" />} onClick={() => handleRemoveActivity(day.dayNumber, item.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Add Activity Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Add Activity to Day ${targetDay}`}>
        <form onSubmit={handleCreateActivity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Day Number</label>
            <input
              type="number"
              min="1"
              max={durationDays}
              value={targetDay}
              onChange={(e) => setTargetDay(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', color: 'var(--color-text-primary, #1c1410)' }}
            />
          </div>

          <Input label="Activity Name" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. Louvre Museum Guided Tour" required />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Rue de Rivoli, Paris" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Start Time (HH:MM)" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="09:30" required />
            <Input label="End Time (HH:MM)" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="12:00" required />
          </div>

          <Input label={`Estimated Cost (${trip.currency})`} type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="30" />
          <Input label="Notes / Instructions" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Pre-booked tickets required" />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add to Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Activity Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Activity Item">
        <form onSubmit={handleSaveEditActivity} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input label="Activity Name" value={activity} onChange={(e) => setActivity(e.target.value)} required />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Start Time (HH:MM)" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            <Input label="End Time (HH:MM)" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>

          <Input label={`Estimated Cost (${trip.currency})`} type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


