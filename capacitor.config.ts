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
    contentInset: 'always',
    infoPlist: {
      NSCameraUsageDescription: 'OrthoCross uses the camera to (1) scan QR codes to join groups/events, (2) take a profile photo, and (3) add photos to your journal—for example, point at a group invite QR or snap a journal image.',
      NSPhotoLibraryUsageDescription: 'Allow OrthoCross to access your photos so you can choose an existing picture for your profile or add images to your journal (e.g., pick a recent photo).',
      NSPhotoLibraryAddUsageDescription: 'OrthoCross saves photos or videos you create (e.g., export a journal image) to your library when you ask it to.',
      NSMicrophoneUsageDescription: 'OrthoCross uses the microphone only when you record a video note for your journal (e.g., add a short spoken reflection).',
    },
  },
};

export default config;
