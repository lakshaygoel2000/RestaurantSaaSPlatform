import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restaurantos.app',
  appName: 'RestaurantOS',
  webDir: 'dist/public',
  server: {
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
