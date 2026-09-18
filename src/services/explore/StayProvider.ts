import { Stay } from '@/types/travel';

export interface IStayProvider {
  searchStays(destination: string, query?: string): Promise<Stay[]>;
  getStayById(id: string): Promise<Stay | undefined>;
}

const DESTINATION_STAYS_DB: Record<string, Stay[]> = {
  'paris': [
    {
      id: 'stay-paris-le-meurice',
      name: 'Le Meurice Luxury Palace Hotel',
      destination: 'Paris, France',
      location: '1st Arr. (Tuileries / Louvre)',
      address: '228 Rue de Rivoli, 75001 Paris',
      coordinates: { lat: 48.8656, lng: 2.3298 },
      category: 'hotel',
      estimatedPricePerNight: { amount: 850, currency: 'EUR', trustLabel: 'ESTIMATED' },
      rating: 4.9,
      amenities: ['Spa', 'Michelin Dining', 'Concierge', 'City Views', 'Valet Parking'],
      source: 'TravelShield Hotel Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'stay-paris-citizenm',
      name: 'citizenM Paris Gare de Lyon',
      destination: 'Paris, France',
      location: '12th Arr. (Bercy / Gare de Lyon)',
      address: '8 Rue Van Gogh, 75012 Paris',
      coordinates: { lat: 48.8448, lng: 2.3734 },
      category: 'hotel',
      estimatedPricePerNight: { amount: 160, currency: 'EUR', trustLabel: 'ESTIMATED' },
      rating: 4.6,
      amenities: ['Rooftop Bar', 'Ultra-fast Wi-Fi', 'Rain Showers', 'Workspaces'],
      source: 'TravelShield Hotel Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'stay-paris-marais-boutique',
      name: 'Hôtel Caron de Beaumarchais',
      destination: 'Paris, France',
      location: '4th Arr. (Le Marais)',
      address: '12 Rue Vieille-du-Temple, 75004 Paris',
      coordinates: { lat: 48.8576, lng: 2.3577 },
      category: 'hotel',
      estimatedPricePerNight: { amount: 220, currency: 'EUR', trustLabel: 'ESTIMATED' },
      rating: 4.7,
      amenities: ['Period Decor', 'Air Conditioning', 'Breakfast Service', 'Central Location'],
      source: 'TravelShield Hotel Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
    }
  ],
  'tokyo': [
    {
      id: 'stay-tokyo-aman',
      name: 'Aman Tokyo',
      destination: 'Tokyo, Japan',
      location: 'Otemachi / Tokyo Station Area',
      address: '1-5-6 Otemachi, Chiyoda City, Tokyo',
      coordinates: { lat: 35.6881, lng: 139.7645 },
      category: 'hotel',
      estimatedPricePerNight: { amount: 110000, currency: 'JPY', trustLabel: 'ESTIMATED' },
      rating: 4.9,
      amenities: ['Indoor Pool', 'Spa', 'Mt. Fuji Views', 'Fine Dining', 'Traditional Bathing'],
      source: 'TravelShield Hotel Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'stay-tokyo-shinjuku-granbell',
      name: 'Shinjuku Granbell Hotel',
      destination: 'Tokyo, Japan',
      location: 'Shinjuku (Kabukicho East)',
      address: '2-14-5 Kabukicho, Shinjuku City, Tokyo',
      coordinates: { lat: 35.6968, lng: 139.7061 },
      category: 'hotel',
      estimatedPricePerNight: { amount: 18000, currency: 'JPY', trustLabel: 'ESTIMATED' },
      rating: 4.4,
      amenities: ['Terrace Bar', 'Modern Design', 'Restaurant', 'Station Proximity'],
      source: 'TravelShield Hotel Research Engine',
      trustLabel: 'ESTIMATED',
      imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    }
  ]
};

export class StayProvider implements IStayProvider {
  async searchStays(destination: string, query?: string): Promise<Stay[]> {
    const destKey = (destination || '').toLowerCase().trim();
    let results: Stay[] = [];

    const matchedKey = Object.keys(DESTINATION_STAYS_DB).find(k => destKey.includes(k));
    if (matchedKey) {
      results = [...DESTINATION_STAYS_DB[matchedKey]];
    } else {
      results = this.generateFallbackStays(destination);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        s => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)
      );
    }

    return results;
  }

  async getStayById(id: string): Promise<Stay | undefined> {
    for (const list of Object.values(DESTINATION_STAYS_DB)) {
      const found = list.find(s => s.id === id);
      if (found) return found;
    }
    return undefined;
  }

  private generateFallbackStays(destination: string): Stay[] {
    const destName = destination || 'Target Destination';
    return [
      {
        id: `stay-gen-${destName.toLowerCase().replace(/\s+/g, '-')}-1`,
        name: `${destName} Grand Hotel & Suites`,
        destination: destName,
        location: `Central Downtown, ${destName}`,
        category: 'hotel',
        estimatedPricePerNight: { amount: 180, currency: 'USD', trustLabel: 'ESTIMATED' },
        rating: 4.5,
        amenities: ['Free High-Speed Wi-Fi', 'Fitness Center', 'Breakfast Included', '24/7 Front Desk'],
        source: 'TravelShield Fallback Research Generator',
        trustLabel: 'ESTIMATED',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: `stay-gen-${destName.toLowerCase().replace(/\s+/g, '-')}-2`,
        name: `${destName} Boutique City Inn`,
        destination: destName,
        location: `Old Town District, ${destName}`,
        category: 'hotel',
        estimatedPricePerNight: { amount: 110, currency: 'USD', trustLabel: 'ESTIMATED' },
        rating: 4.3,
        amenities: ['Boutique Decor', 'Coffee Bar', 'Air Conditioning', 'Central Location'],
        source: 'TravelShield Fallback Research Generator',
        trustLabel: 'ESTIMATED',
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      }
    ];
  }
}

export const stayProvider = new StayProvider();
