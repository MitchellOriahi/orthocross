import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

export const useNotifications = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === 'granted') {
          console.log('Notification permissions granted');
        }
      } catch (error) {
        console.log('Notifications not available on this platform');
      }
    };

    requestPermissions();
  }, []);

  const scheduleNotification = async (title: string, body: string, scheduledTime?: Date) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 100000),
            schedule: scheduledTime ? { at: scheduledTime } : undefined,
          },
        ],
      });
    } catch (error) {
      console.log('Error scheduling notification:', error);
    }
  };

  return { scheduleNotification };
};
