export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
    url?: string;
  };
  plugins?: Record<string, any>;
  android?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.travelshield.ai',
  appName: 'TravelShield AI',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    // In local development on device, point to your computer's LAN IP or use bundled assets
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos'],
    },
    Geolocation: {
      permissions: ['location'],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
