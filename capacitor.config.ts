import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.b611f71fb22b4a938697f6b6fb41b6eb',
  appName: 'orthodox-path-builder',
  webDir: 'dist',
  server: {
    url: 'https://b611f71f-b22b-4a93-8697-f6b6fb41b6eb.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
    },
  },
};

export default config;
