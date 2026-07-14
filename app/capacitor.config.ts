import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restaurantos.app',
  appName: 'RestaurantOS',
  webDir: 'dist/public',
  server: {
    cleartext: true,
    // Allow the app to make requests to the API server
    // The actual API URL is configured in the frontend code (trpc.tsx)
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
