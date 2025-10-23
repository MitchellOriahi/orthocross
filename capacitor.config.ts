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
      smallIcon: "ic_stat_icon",
      iconColor: "#8B4513",
    },
  },
  ios: {
    infoPlist: {
      NSCameraUsageDescription: "OrthoCross uses the camera to take your profile photo and add photos to your journal (e.g., capture a scripture page or set your profile picture).",
      NSPhotoLibraryUsageDescription: "OrthoCross needs access to your photo library to select photos for your profile and journal entries."
    }
  }
};

export default config;
