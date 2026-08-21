import { CapacitorConfig } from '@capacitor/core';

// Set CAP_LIVE_RELOAD to your dev server URL (e.g. http://192.168.1.10:8080)
// before `npx cap sync` to hot-reload against a machine on your LAN.
// For production / App Store / Play Store builds, leave it unset so the
// app loads the bundled `dist/` (required by Apple, and prevents the
// Android "crash before splash" caused by loading a remote URL).
const liveReloadUrl = process.env.CAP_LIVE_RELOAD;

const config: CapacitorConfig = {
  appId: 'com.orthocross.myapp',
  appName: 'OrthoCross',
  webDir: 'dist',
  ...(liveReloadUrl
    ? {
        server: {
          url: liveReloadUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#8B4513',
    },
  },
  ios: {
    contentInset: 'always',
    infoPlist: {
      NSCameraUsageDescription: 'OrthoCross uses the camera to (1) scan QR codes to join groups/events, (2) take a profile photo, and (3) add photos to your journal—for example, point at a group invite QR or snap a journal image.',
      NSPhotoLibraryUsageDescription: 'Allow OrthoCross to access your photos so you can choose an existing picture for your profile or add images to your journal (e.g., pick a recent photo).',
      NSPhotoLibraryAddUsageDescription: 'OrthoCross saves photos or videos you create (e.g., export a journal image) to your library when you ask it to.',
      NSMicrophoneUsageDescription: 'OrthoCross uses the microphone only when you record a video note for your journal (e.g., add a short spoken reflection).',
      NSLocationWhenInUseUsageDescription: 'OrthoCross may use your location to provide relevant local Orthodox church information and community features near you.',
    },
  },
};

export default config;
