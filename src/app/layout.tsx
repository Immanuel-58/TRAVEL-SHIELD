import type { Metadata } from 'next';
import '../styles/tokens.css';
import './globals.css';
import { TripProvider } from '@/context/TripContext';
import { OfflineProvider } from '@/context/OfflineContext';
import { AppHeader } from '@/components/shell/AppHeader';
import { OfflineBanner } from '@/components/shell/OfflineBanner';
import { MobileBottomNav } from '@/components/shell/MobileBottomNav';

export const metadata: Metadata = {
  title: 'TravelShield AI — All-in-One Intelligent Travel Companion',
  description: 'Protect. Prove. Adapt. Plan, organize, manage, protect, and adapt your complete trip inside one unified workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TripProvider>
          <OfflineProvider>
            <AppHeader />
            <OfflineBanner />
            <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
              {children}
            </main>
            <MobileBottomNav />
          </OfflineProvider>
        </TripProvider>
      </body>
    </html>
  );
}

