import { DestinationResearch } from '@/types/travel';
import { placesProvider } from './PlacesProvider';
import { stayProvider } from './StayProvider';

export interface IDestinationResearchProvider {
  getDestinationResearch(destination: string): Promise<DestinationResearch>;
}

const DESTINATION_INSIGHTS_DB: Record<string, Partial<DestinationResearch>> = {
  'paris': {
    destination: 'Paris, France',
    bestAreasToStay: [
      {
        name: 'Le Marais (4th Arr.)',
        description: 'Vibrant historic quarter ideal for first-timers, foodies, and boutique shoppers.',
        highlights: ['Central walking location', 'Great dining scene', 'Historic architecture'],
      },
      {
        name: 'Saint-Germain-des-Prés (6th Arr.)',
        description: 'Chic Left Bank neighborhood filled with literary cafes, art galleries, and upscale shops.',
        highlights: ['Quintessential Parisian feel', 'Luxembourg Gardens nearby', 'Safe and romantic'],
      },
      {
        name: 'Montmartre (18th Arr.)',
        description: 'Bohemian hilltop area with cobblestone lanes, Sacré-Cœur views, and artistic heritage.',
        highlights: ['Panoramic views', 'Artistic history', 'Charming village vibe'],
      }
    ],
    generalNotes: [
      'Public Metro is the fastest way around Paris. Buy a Navigo Easy pass for convenience.',
      'Museum passes save time with skip-the-line privileges at major attractions like the Louvre and Musée d\'Orsay.',
      'Tipping is included in restaurant bills ("service compris"), but leaving 5-10% extra is appreciated for great service.'
    ],
    seasonConsiderations: [
      'Spring (April-May) and Autumn (Sept-Oct) offer mild weather and manageable tourist crowds.',
      'Summer (July-August) can be warm and busy, though days are long and pleasant in the evenings.'
    ]
  },
  'tokyo': {
    destination: 'Tokyo, Japan',
    bestAreasToStay: [
      {
        name: 'Shinjuku',
        description: 'Major transit and entertainment hub packed with neon nightlife, shopping, and dining.',
        highlights: ['Unmatched transit connectivity', 'Golden Gai nightlife', 'Shinjuku Gyoen park'],
      },
      {
        name: 'Asakusa',
        description: 'Traditional neighborhood around Senso-ji temple with a relaxed historic atmosphere.',
        highlights: ['Traditional vibe', 'Affordable stays', 'Senso-ji & Sumida River'],
      },
      {
        name: 'Ginza',
        description: 'Upscale shopping and luxury dining quarter with world-class department stores.',
        highlights: ['Luxury shopping', 'Michelin dining', 'Quiet at night'],
      }
    ],
    generalNotes: [
      'Suica or Pasmo IC cards make Metro and JR train travel effortless.',
      'Trash cans are rare in public; carry a small bag to hold your trash until returning to hotel or convenience stores.',
      'Tipping is NOT customary in Japan and may cause confusion.'
    ],
    seasonConsiderations: [
      'Cherry blossom (Sakura) season typically peaks late March to early April.',
      'Autumn foliage (Momiji) peaks from mid-November to early December with stunning colors.'
    ]
  }
};

export class DestinationResearchProvider implements IDestinationResearchProvider {
  async getDestinationResearch(destination: string): Promise<DestinationResearch> {
    const destKey = (destination || '').toLowerCase().trim();

    const topPlaces = await placesProvider.searchPlaces(destination);
    const topStays = await stayProvider.searchStays(destination);

    const matchedKey = Object.keys(DESTINATION_INSIGHTS_DB).find(k => destKey.includes(k));
    const insight = matchedKey ? DESTINATION_INSIGHTS_DB[matchedKey] : null;

    if (insight) {
      return {
        destination: insight.destination || destination,
        bestAreasToStay: insight.bestAreasToStay || [],
        topPlaces,
        topStays,
        generalNotes: insight.generalNotes || [],
        seasonConsiderations: insight.seasonConsiderations || [],
      };
    }

    // Dynamic fallback research
    return {
      destination,
      bestAreasToStay: [
        {
          name: `Central Downtown ${destination}`,
          description: `Prime central location close to main attractions and public transit hubs in ${destination}.`,
          highlights: ['Walkability', 'Dining options', 'Public transport access'],
        },
        {
          name: `Historic Quarter in ${destination}`,
          description: `Charming heritage area featuring local architecture, markets, and cultural landmarks.`,
          highlights: ['Cultural atmosphere', 'Local food', 'Boutique stays'],
        }
      ],
      topPlaces,
      topStays,
      generalNotes: [
        `Research local transit options when arriving in ${destination}.`,
        `Verify opening times for top attractions in advance.`
      ],
      seasonConsiderations: [
        `Check seasonal weather patterns for ${destination} before packing.`
      ]
    };
  }
}

export const destinationResearchProvider = new DestinationResearchProvider();
