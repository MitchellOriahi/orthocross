import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getVerseOfTheDay } from '@/lib/verseOfTheDay';

export interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

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
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#8B4513',
            channelId: 'orthocross-reminders',
          },
        ],
      });
    } catch (error) {
      console.log('Error scheduling notification:', error);
    }
  };

  const scheduleFastingReminder = async (
    eventName: string, 
    eventType: string, 
    tradition: string, 
    date: Date
  ) => {
    try {
      const eventDate = new Date(date);
      // Set to 8pm the day before
      eventDate.setDate(eventDate.getDate() - 1);
      eventDate.setHours(20, 0, 0, 0);
      
      const today = new Date();
      
      // Skip if the notification date has passed
      if (eventDate < today) {
        console.log(`Skipping past notification for ${eventName}`);
        return;
      }

      const title = eventType === "fast" ? "🕊️ Upcoming Fast" : "✨ Upcoming Feast";
      const body = eventType === "fast"
        ? `${eventName} begins tomorrow (${tradition}). Prepare to observe the fast.`
        : `${eventName} is tomorrow (${tradition}). Prepare for the feast!`;
      
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: eventDate },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
          iconColor: '#8B4513',
          channelId: 'orthocross-fasting',
        }],
      });

      console.log(`Scheduled fasting notification for ${eventName} at 8pm the day before`);
    } catch (error) {
      console.log('Error scheduling fasting reminder:', error);
    }
  };

  return { 
    scheduleNotification, 
    scheduleFastingReminder,
  };
};