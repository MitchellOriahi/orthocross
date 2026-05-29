import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const STORAGE_KEY_FIRST_OPEN = 'app_first_open_date';
const STORAGE_KEY_OPEN_COUNT = 'app_open_count';
const STORAGE_KEY_PROMPTED = 'hasSeenRatingPrompt';
const MIN_DAYS = 3;
const MIN_OPENS = 3;

// Fill in IOS_APP_STORE_URL after the app is published to the App Store
const IOS_APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_IOS_APP_ID';
const ANDROID_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.lovable.b611f71fb22b4a938697f6b6fb41b6eb';

export const openAppStoreForRating = () => {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') {
    window.open(IOS_APP_STORE_URL, '_system');
  } else if (platform === 'android') {
    window.open(ANDROID_PLAY_STORE_URL, '_system');
  }
};

export const useAppRating = () => {
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        if (localStorage.getItem(STORAGE_KEY_PROMPTED)) return;
        if (Capacitor.getPlatform() === 'web') return;

        const now = Date.now();

        if (!localStorage.getItem(STORAGE_KEY_FIRST_OPEN)) {
          localStorage.setItem(STORAGE_KEY_FIRST_OPEN, String(now));
        }

        const openCount = parseInt(localStorage.getItem(STORAGE_KEY_OPEN_COUNT) || '0', 10) + 1;
        localStorage.setItem(STORAGE_KEY_OPEN_COUNT, String(openCount));

        const firstOpen = parseInt(localStorage.getItem(STORAGE_KEY_FIRST_OPEN)!, 10);
        const daysSinceFirst = (now - firstOpen) / (1000 * 60 * 60 * 24);

        if (openCount >= MIN_OPENS && daysSinceFirst >= MIN_DAYS) {
          localStorage.setItem(STORAGE_KEY_PROMPTED, 'true');
          setShowRatingPrompt(true);
        }
      } catch {
        // Silently ignore storage errors
      }
    };

    const timer = setTimeout(check, 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismissRatingPrompt = () => setShowRatingPrompt(false);

  return { showRatingPrompt, dismissRatingPrompt };
};
