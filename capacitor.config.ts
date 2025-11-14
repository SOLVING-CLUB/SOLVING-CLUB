import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'club.solving.mobile',
  appName: 'Solving Club',
  webDir: 'dist/public',
  // Standalone mobile app - no server needed!
  // Builds static files that connect directly to Supabase
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
