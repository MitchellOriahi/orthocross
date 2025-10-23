import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.b611f71fb22b4a938697f6b6fb41b6eb',
  appName: 'orthodox-path-builder',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.orthocross.com',
    cleartext: false
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#8B4513",
    },
  },
};

export default config;
