import { Place, PlaceCategory } from '@/types/travel';

export interface IPlacesProvider {
  searchPlaces(destination: string, query?: string, category?: PlaceCategory | 'all'): Promise<Place[]>;
  getPlaceById(id: string): Promise<Place | undefined>;
}

const DESTINATION_PLACES_DB: Record<string, Place[]> = {
  'paris': [
    {
      id: 'place-paris-eiffel',
      name: 'Eiffel Tower',
      destination: 'Paris, France',
      category: 'attraction',
      description: 'Iconic 330m iron lattice tower on Champ de Mars offering breathtaking views over Paris.',
      address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
      coordinates: { lat: 48.8584, lng: 2.2945 },
      estimatedVisitDurationMinutes: 120,
      estimatedCost: { amount: 30, currency: 'EUR', trustLabel: 'ESTIMATED' },
      openingInfo: 'Daily 09:30 - 22:45',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-paris-louvre',
      name: 'Louvre Museum',
      destination: 'Paris, France',
      category: 'attraction',
      description: 'World’s largest art museum, home to the Mona Lisa and Venus de Milo.',
      address: 'Rue de Rivoli, 75001 Paris',
      coordinates: { lat: 48.8606, lng: 2.3376 },
      estimatedVisitDurationMinutes: 180,
      estimatedCost: { amount: 22, currency: 'EUR', trustLabel: 'ESTIMATED' },
      openingInfo: 'Wed-Mon 09:00 - 18:00 (Closed Tuesdays)',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-paris-sacrecœur',
      name: 'Sacre-Cœur Basilica Hill Viewpoint',
      destination: 'Paris, France',
      category: 'viewpoint',
      description: 'Stunning Roman-Byzantine basilica perched at Montmartre summit with panoramic views over Paris skyline.',
      address: '35 Rue du Chevalier de la Barre, 75018 Paris',
      coordinates: { lat: 48.8867, lng: 2.3431 },
      estimatedVisitDurationMinutes: 90,
      estimatedCost: { amount: 0, currency: 'EUR', trustLabel: 'ESTIMATED' },
      openingInfo: 'Daily 06:30 - 22:30',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-paris-le-marais',
      name: 'Le Marais Historic District',
      destination: 'Paris, France',
      category: 'neighborhood',
      description: 'Trendy historic district known for cobblestone streets, falafel eateries, art galleries, and boutique shopping.',
      address: 'Le Marais, 75004 Paris',
      coordinates: { lat: 48.8570, lng: 2.3590 },
      estimatedVisitDurationMinutes: 150,
      estimatedCost: { amount: 15, currency: 'EUR', trustLabel: 'ESTIMATED' },
      openingInfo: 'Open 24/7',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1509299349698-dd22323b5963?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-paris-bouillon-chartier',
      name: 'Bouillon Chartier Traditional Dining',
      destination: 'Paris, France',
      category: 'food',
      description: 'Classic Belle Époque French bistro serving authentic traditional Parisian comfort dishes at affordable prices.',
      address: '7 Rue du Faubourg Montmartre, 75009 Paris',
      coordinates: { lat: 48.8718, lng: 2.3434 },
      estimatedVisitDurationMinutes: 90,
      estimatedCost: { amount: 25, currency: 'EUR', trustLabel: 'ESTIMATED' },
      openingInfo: 'Daily 11:30 - 00:00',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-paris-seine-cruise',
      name: 'Seine River Evening Sunset Cruise',
      destination: 'Paris, France',
      category: 'activity',
      description: 'Glide past illuminate monuments including Notre-Dame and Musée d\'Orsay along the Seine.',
      address: 'Port de la Bourdonnais, 75007 Paris',
      coordinates: { lat: 48.8596, lng: 2.2933 },
      estimatedVisitDurationMinutes: 75,
      estimatedCost: { amount: 18, currency: 'EUR', trustLabel: 'ESTIMATED' },
      openingInfo: 'Departures every 30 mins 10:00 - 22:00',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=800&q=80',
    }
  ],
  'tokyo': [
    {
      id: 'place-tokyo-sensoji',
      name: 'Senso-ji Temple & Asakusa',
      destination: 'Tokyo, Japan',
      category: 'attraction',
      description: 'Tokyo\'s oldest Buddhist temple featuring the iconic Kaminarimon gate and Nakamise shopping street.',
      address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032',
      coordinates: { lat: 35.7148, lng: 139.7967 },
      estimatedVisitDurationMinutes: 120,
      estimatedCost: { amount: 0, currency: 'JPY', trustLabel: 'ESTIMATED' },
      openingInfo: 'Main hall 06:00 - 17:00, grounds 24/7',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-tokyo-shibuya-sky',
      name: 'Shibuya Sky Observation Deck',
      destination: 'Tokyo, Japan',
      category: 'viewpoint',
      description: 'Rooftop open-air observation deck on top of Shibuya Scramble Square offering 360-degree views of Tokyo.',
      address: '2-24-12 Shibuya, Shibuya City, Tokyo 150-0002',
      coordinates: { lat: 35.6585, lng: 139.7013 },
      estimatedVisitDurationMinutes: 90,
      estimatedCost: { amount: 2200, currency: 'JPY', trustLabel: 'ESTIMATED' },
      openingInfo: 'Daily 10:00 - 22:30',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'place-tokyo-tsukiji-outer',
      name: 'Tsukiji Outer Food Market',
      destination: 'Tokyo, Japan',
      category: 'food',
      description: 'Vibrant food market packed with stalls selling fresh sushi, wagyu skewers, tamagoyaki, and street seafood.',
      address: '4-16-2 Tsukiji, Chuo City, Tokyo 104-0045',
      coordinates: { lat: 35.6654, lng: 139.7707 },
      estimatedVisitDurationMinutes: 90,
      estimatedCost: { amount: 2500, currency: 'JPY', trustLabel: 'ESTIMATED' },
      openingInfo: 'Mon-Sat 06:00 - 14:00',
      source: 'TravelShield Destination Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    }
  ]
};

export class PlacesProvider implements IPlacesProvider {
  async searchPlaces(destination: string, query?: string, category?: PlaceCategory | 'all'): Promise<Place[]> {
    const destKey = (destination || '').toLowerCase().trim();
    let results: Place[] = [];

    // Check matched static destination data
    const matchedKey = Object.keys(DESTINATION_PLACES_DB).find(k => destKey.includes(k));
    if (matchedKey) {
      results = [...DESTINATION_PLACES_DB[matchedKey]];
    } else {
      // Dynamic fallback generator for any arbitrary destination
      results = this.generateFallbackPlaces(destination);
    }

    // Filter by query if present
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    // Filter by category if present
    if (category && category !== 'all') {
      results = results.filter(p => p.category === category);
    }

    return results;
  }

  async getPlaceById(id: string): Promise<Place | undefined> {
    for (const list of Object.values(DESTINATION_PLACES_DB)) {
      const found = list.find(p => p.id === id);
      if (found) return found;
    }
    return undefined;
  }

  private generateFallbackPlaces(destination: string): Place[] {
    const destName = destination || 'Target Destination';
    return [
      {
        id: `place-gen-${destName.toLowerCase().replace(/\s+/g, '-')}-1`,
        name: `${destName} Historic City Center`,
        destination: destName,
        category: 'attraction',
        description: `Explore the vibrant central landmark district of ${destName} featuring iconic architecture and historic plazas.`,
        address: `Central District, ${destName}`,
        estimatedVisitDurationMinutes: 120,
        estimatedCost: { amount: 15, currency: 'USD', trustLabel: 'ESTIMATED' },
        openingInfo: 'Open daily 08:00 - 20:00',
        source: 'TravelShield Fallback Research Generator',
        trustLabel: 'ESTIMATED',
        imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: `place-gen-${destName.toLowerCase().replace(/\s+/g, '-')}-2`,
        name: `${destName} Panoramic Lookout Point`,
        destination: destName,
        category: 'viewpoint',
        description: `Top vantage point overlooking ${destName} offering stunning sunset views and photo opportunities.`,
        address: `Heights Promenade, ${destName}`,
        estimatedVisitDurationMinutes: 60,
        estimatedCost: { amount: 0, currency: 'USD', trustLabel: 'ESTIMATED' },
        openingInfo: 'Open 24/7',
        source: 'TravelShield Fallback Research Generator',
        trustLabel: 'ESTIMATED',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: `place-gen-${destName.toLowerCase().replace(/\s+/g, '-')}-3`,
        name: `Local Food Market & Cuisine Trail in ${destName}`,
        destination: destName,
        category: 'food',
        description: `Sample authentic local specialties, street food delicacies, and regional flavors of ${destName}.`,
        address: `Market Quarter, ${destName}`,
        estimatedVisitDurationMinutes: 90,
        estimatedCost: { amount: 25, currency: 'USD', trustLabel: 'ESTIMATED' },
        openingInfo: 'Daily 10:00 - 22:00',
        source: 'TravelShield Fallback Research Generator',
        trustLabel: 'ESTIMATED',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: `place-gen-${destName.toLowerCase().replace(/\s+/g, '-')}-4`,
        name: `${destName} Cultural Walking Tour`,
        destination: destName,
        category: 'activity',
        description: `Guided neighborhood exploration focusing on heritage, local lifestyle, and hidden gems of ${destName}.`,
        address: `Main Boulevard, ${destName}`,
        estimatedVisitDurationMinutes: 150,
        estimatedCost: { amount: 35, currency: 'USD', trustLabel: 'ESTIMATED' },
        openingInfo: 'Tours at 10:00 & 14:00',
        source: 'TravelShield Fallback Research Generator',
        trustLabel: 'ESTIMATED',
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      }
    ];
  }
}

export const placesProvider = new PlacesProvider();
