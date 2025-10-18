import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const useNotificationSetup = () => {
  useEffect(() => {
    const setupNotificationChannels = async () => {
      // Only works on native platforms
      if (Capacitor.getPlatform() === 'web') {
        console.log('Notifications not supported on web platform');
        return;
      }

      try {
        // Request permissions first
        const permission = await LocalNotifications.requestPermissions();
        
        if (permission.display !== 'granted') {
          console.log('Notification permissions not granted');
          return;
        }

        // Create notification channels for Android
        // iOS doesn't use channels, but this won't error
        await LocalNotifications.createChannel({
          id: 'orthocross-reminders',
          name: 'Daily Reminders',
          description: 'Notifications for daily Bible reading and verse of the day',
          importance: 4, // HIGH
          sound: 'default',
          vibration: true,
        });

        await LocalNotifications.createChannel({
          id: 'orthocross-fasting',
          name: 'Fasting & Feasting',
          description: 'Reminders for Orthodox fasting periods and feast days',
          importance: 4, // HIGH
          sound: 'default',
          vibration: true,
        });

        await LocalNotifications.createChannel({
          id: 'orthocross-friends',
          name: 'Friends & Leaderboard',
          description: 'Updates from friends and leaderboard changes',
          importance: 3, // DEFAULT
          sound: 'default',
          vibration: true,
        });

        console.log('Notification channels created successfully');
      } catch (error) {
        console.error('Error setting up notification channels:', error);
      }
    };

    setupNotificationChannels();
  }, []);
};
