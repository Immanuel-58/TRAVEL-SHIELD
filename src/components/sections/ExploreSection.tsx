'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTrip } from '@/context/TripContext';
import { placesProvider } from '@/services/explore/PlacesProvider';
import { stayProvider } from '@/services/explore/StayProvider';
import { destinationResearchProvider } from '@/services/explore/DestinationResearchProvider';
import { Place, Stay, DestinationResearch, PlaceCategory } from '@/types/travel';
import { TravelEngine } from '@/services/travel/TravelEngine';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Compass, 
  Search, 
  MapPin, 
  Hotel, 
  Bookmark, 
  BookmarkCheck, 
  CalendarPlus, 
  PlusCircle, 
  Clock, 
  Star, 
  Info, 
  Sparkles,
  Layers,
  Building,
  Camera,
  Utensils,
  Ticket
} from 'lucide-react';

type ExploreTab = 'all' | 'attractions' | 'viewpoints' | 'food' | 'activities' | 'neighborhoods' | 'stays' | 'saved';

export function ExploreSection({ tripId }: { tripId?: string }) {
  const { 
    activeTrip, 
    getTripById, 
    savePlace, 
    removeSavedPlace, 
    saveStay, 
    removeSavedStay, 
    addPlaceToItinerary, 
    addStayCostToBudget 
  } = useTrip();

  const trip = tripId ? getTripById(tripId) : activeTrip;

  const [activeTab, setActiveTab] = useState<ExploreTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [research, setResearch] = useState<DestinationResearch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Place / Stay for details modal
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);

  // Add to Itinerary Modal state
  const [isAddToItineraryOpen, setIsAddToItineraryOpen] = useState(false);
  const [targetDay, setTargetDay] = useState(1);
  const [targetStartTime, setTargetStartTime] = useState('10:00');

  // Add Stay Cost Modal state
  const [isAddStayCostOpen, setIsAddStayCostOpen] = useState(false);
  const [stayNights, setStayNights] = useState(1);

  const destination = trip?.destination || 'Paris, France';
  const durationDays = trip ? TravelEngine.calculateTripDuration(trip.startDate, trip.endDate) || 7 : 7;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadExploreData() {
      try {
        const placeResults = await placesProvider.searchPlaces(destination, searchQuery);
        const stayResults = await stayProvider.searchStays(destination, searchQuery);
        const researchData = await destinationResearchProvider.getDestinationResearch(destination);

        if (isMounted) {
          setPlaces(placeResults);
          setStays(stayResults);
          setResearch(researchData);
        }
      } catch (err) {
        console.error('Failed to load explore data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadExploreData();

    return () => {
      isMounted = false;
    };
  }, [destination, searchQuery]);

  if (!trip) return null;

  const savedPlaces = trip.savedPlaces || [];
  const savedStays = trip.savedStays || [];

  const isPlaceSaved = (pId: string) => savedPlaces.some(p => p.id === pId);
  const isStaySaved = (sId: string) => savedStays.some(s => s.id === sId);

  const handleToggleSavePlace = (place: Place) => {
    if (isPlaceSaved(place.id)) {
      removeSavedPlace(trip.id, place.id);
    } else {
      savePlace(trip.id, place);
    }
  };

  const handleToggleSaveStay = (stay: Stay) => {
    if (isStaySaved(stay.id)) {
      removeSavedStay(trip.id, stay.id);
    } else {
      saveStay(trip.id, stay);
    }
  };

  const handleConfirmAddPlaceToItinerary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    addPlaceToItinerary(trip.id, selectedPlace, Number(targetDay), targetStartTime);
    setIsAddToItineraryOpen(false);
    setSelectedPlace(null);
  };

  const handleConfirmAddStayCostToBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay) return;

    addStayCostToBudget(trip.id, selectedStay, Number(stayNights));
    setIsAddStayCostOpen(false);
    setSelectedStay(null);
  };

  // Filtered views according to active tab
  const filteredPlaces = places.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'attractions') return p.category === 'attraction';
    if (activeTab === 'viewpoints') return p.category === 'viewpoint';
    if (activeTab === 'food') return p.category === 'food';
    if (activeTab === 'activities') return p.category === 'activity';
    if (activeTab === 'neighborhoods') return p.category === 'neighborhood';
    return false;
  });

  const showStays = activeTab === 'all' || activeTab === 'stays';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Active Trip Destination Hero Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
        border: '1px solid var(--border-active)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Badge variant="cyan">EXPLORE & TRAVEL RESEARCH</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Connected to Active Workspace</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={24} color="var(--accent-cyan)" />
            Explore {trip.destination}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Discover top attractions, viewpoints, local food, and stays for your {durationDays}-day trip. Save research directly to your workspace.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #e0d5c8)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Saved Research</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {savedPlaces.length + savedStays.length} Items
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search places, attractions, food, or stays in ${destination}...`}
            style={{
              width: '100%',
              padding: '12px 16px 12px 46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e0d5c8)',
              color: 'var(--color-text-primary, #1c1410)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: 'All Research', icon: <Layers size={14} /> },
          { id: 'attractions', label: 'Attractions', icon: <Camera size={14} /> },
          { id: 'viewpoints', label: 'Viewpoints', icon: <Compass size={14} /> },
          { id: 'food', label: 'Food & Dining', icon: <Utensils size={14} /> },
          { id: 'activities', label: 'Activities', icon: <Ticket size={14} /> },
          { id: 'neighborhoods', label: 'Areas', icon: <MapPin size={14} /> },
          { id: 'stays', label: 'Stays & Hotels', icon: <Hotel size={14} /> },
          { id: 'saved', label: `Saved (${savedPlaces.length + savedStays.length})`, icon: <Bookmark size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ExploreTab)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)' : 'rgba(255, 255, 255, 0.04)',
              border: activeTab === tab.id ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Destination Research Insights Box */}
      {research && activeTab === 'all' && !searchQuery && (
        <Card style={{ padding: '20px', background: 'var(--color-surface-muted, #f4f0ea)', border: '1px solid var(--color-border, #e0d5c8)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary, #1c1410)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-amber)" />
            Best Areas to Stay in {research.destination}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {research.bestAreasToStay.map((area, idx) => (
              <div key={idx} style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #e0d5c8)' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {area.name}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Saved View Tab */}
      {activeTab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>Saved Trip Research ({savedPlaces.length + savedStays.length})</h3>

          {savedPlaces.length === 0 && savedStays.length === 0 ? (
            <Card style={{ padding: '40px', textAlign: 'center' }}>
              <Bookmark size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No saved places or stays yet. Browse research tabs and click &quot;Save to Trip&quot; to bookmark items.</p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {savedPlaces.map((place) => (
                <Card key={place.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <Badge variant="cyan">{place.category.toUpperCase()}</Badge>
                      <button onClick={() => handleToggleSavePlace(place)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <BookmarkCheck size={20} color="var(--accent-cyan)" />
                      </button>
                    </div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>{place.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{place.description}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <Button size="sm" style={{ flex: 1 }} leftIcon={<CalendarPlus size={14} />} onClick={() => { setSelectedPlace(place); setIsAddToItineraryOpen(true); }}>
                      Add to Day
                    </Button>
                  </div>
                </Card>
              ))}

              {savedStays.map((stay) => (
                <Card key={stay.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <Badge variant="emerald">HOTEL / STAY</Badge>
                      <button onClick={() => handleToggleSaveStay(stay)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <BookmarkCheck size={20} color="var(--accent-emerald)" />
                      </button>
                    </div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>{stay.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>📍 {stay.location}</p>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 700, marginTop: '6px' }}>
                      ${stay.estimatedPricePerNight.amount} / night
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <Button size="sm" variant="secondary" style={{ flex: 1 }} leftIcon={<PlusCircle size={14} />} onClick={() => { setSelectedStay(stay); setIsAddStayCostOpen(true); }}>
                      Add Cost to Budget
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Places Grid */}
      {activeTab !== 'saved' && activeTab !== 'stays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
              Points of Interest & Places ({filteredPlaces.length})
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredPlaces.map((place) => {
              const saved = isPlaceSaved(place.id);

              return (
                <Card key={place.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {place.imageUrl && (
                      <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={place.imageUrl} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <Badge variant="cyan">{place.category.toUpperCase()}</Badge>
                      <span className={`badge-trust badge-trust-${place.trustLabel.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                        {place.trustLabel}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>{place.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                      {place.description}
                    </p>
                  </div>

                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      <span>⏱ {place.estimatedVisitDurationMinutes} mins</span>
                      <span>💰 ${place.estimatedCost.amount} {place.estimatedCost.currency}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button
                        size="sm"
                        variant={saved ? 'secondary' : 'outline'}
                        leftIcon={saved ? <BookmarkCheck size={14} color="var(--accent-cyan)" /> : <Bookmark size={14} />}
                        onClick={() => handleToggleSavePlace(place)}
                      >
                        {saved ? 'Saved' : 'Save'}
                      </Button>

                      {trip && (
                        <Link href={`/trips/${trip.id}/map?placeId=${place.id}`} style={{ textDecoration: 'none' }}>
                          <Button size="sm" variant="outline" leftIcon={<MapPin size={14} color="var(--accent-cyan)" />}>
                            Map
                          </Button>
                        </Link>
                      )}

                      <Button
                        size="sm"
                        style={{ flex: 1 }}
                        leftIcon={<CalendarPlus size={14} />}
                        onClick={() => { setSelectedPlace(place); setIsAddToItineraryOpen(true); }}
                      >
                        Add to Day
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Stays Grid */}
      {activeTab !== 'saved' && showStays && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>
              Stays & Accommodation Research ({stays.length})
            </h3>
            <span className="badge-trust badge-trust-estimated">ESTIMATED NIGHT RATES</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {stays.map((stay) => {
              const saved = isStaySaved(stay.id);

              return (
                <Card key={stay.id} style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {stay.imageUrl && (
                      <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={stay.imageUrl} alt={stay.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <Badge variant="emerald">HOTEL / STAY</Badge>
                      <span className={`badge-trust badge-trust-${stay.trustLabel.toLowerCase()}`} style={{ fontSize: '0.68rem' }}>
                        {stay.trustLabel}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', color: 'var(--color-text-primary, #1c1410)', fontWeight: 700 }}>{stay.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>📍 {stay.location}</p>

                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '8px' }}>
                      ${stay.estimatedPricePerNight.amount} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ night</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                    <Button
                      size="sm"
                      variant={saved ? 'secondary' : 'outline'}
                      leftIcon={saved ? <BookmarkCheck size={14} color="var(--accent-emerald)" /> : <Bookmark size={14} />}
                      onClick={() => handleToggleSaveStay(stay)}
                    >
                      {saved ? 'Saved' : 'Save'}
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      style={{ flex: 1 }}
                      leftIcon={<PlusCircle size={14} />}
                      onClick={() => { setSelectedStay(stay); setIsAddStayCostOpen(true); }}
                    >
                      Add Cost to Budget
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Place to Itinerary Modal */}
      <Modal
        isOpen={isAddToItineraryOpen}
        onClose={() => setIsAddToItineraryOpen(false)}
        title={`Add "${selectedPlace?.name}" to Itinerary`}
      >
        <form onSubmit={handleConfirmAddPlaceToItinerary} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target Day</label>
            <input
              type="number"
              min="1"
              max={durationDays}
              value={targetDay}
              onChange={(e) => setTargetDay(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #e0d5c8)', color: 'var(--color-text-primary, #1c1410)' }}
            />
          </div>

          <Input
            label="Start Time (HH:MM)"
            value={targetStartTime}
            onChange={(e) => setTargetStartTime(e.target.value)}
            placeholder="10:00"
            required
          />

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Estimated visit duration: <strong>{selectedPlace?.estimatedVisitDurationMinutes || 120} minutes</strong>.<br />
            TravelEngine will automatically validate schedule conflicts on Day {targetDay}.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAddToItineraryOpen(false)}>Cancel</Button>
            <Button type="submit">Schedule Activity</Button>
          </div>
        </form>
      </Modal>

      {/* Add Stay Cost to Budget Modal */}
      <Modal
        isOpen={isAddStayCostOpen}
        onClose={() => setIsAddStayCostOpen(false)}
        title={`Add Accommodation Cost for "${selectedStay?.name}"`}
      >
        <form onSubmit={handleConfirmAddStayCostToBudget} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Number of Nights</label>
            <input
              type="number"
              min="1"
              max="30"
              value={stayNights}
              onChange={(e) => setStayNights(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'var(--color-surface, #ffffff)', border: '1px solid var(--color-border, #e0d5c8)', color: 'var(--color-text-primary, #1c1410)' }}
            />
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--border-active)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated Total Cost:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              ${((selectedStay?.estimatedPricePerNight.amount || 0) * stayNights).toLocaleString()} {trip.currency}
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            This will log an accommodation expense using TravelEngine&apos;s deterministic budget calculation.
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setIsAddStayCostOpen(false)}>Cancel</Button>
            <Button type="submit">Log Accommodation Cost</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
