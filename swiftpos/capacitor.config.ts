import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swiftpos.app',
  appName: 'SwiftPOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
