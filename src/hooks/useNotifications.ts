import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface ReminderTime {
  id: number;
  hour: number;
  minute: number;
  enabled: boolean;
}

const DEFAULT_REMINDERS: ReminderTime[] = [
  { id: 1, hour: 12, minute: 0, enabled: true },
  { id: 2, hour: 18, minute: 0, enabled: true },
];

export const useNotifications = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === 'granted') {
          console.log('Notification permissions granted');
          // Schedule default reminders on first load
          scheduleStreakReminders();
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

  const scheduleStreakReminders = async () => {
    try {
      // Get saved reminders from localStorage
      const savedReminders = localStorage.getItem('streakReminders');
      const reminders: ReminderTime[] = savedReminders 
        ? JSON.parse(savedReminders) 
        : DEFAULT_REMINDERS;

      // Cancel all existing notifications first
      await LocalNotifications.cancel({ notifications: [
        { id: 1001 }, { id: 1002 }, { id: 1003 }
      ]});

      // Schedule new notifications for each enabled reminder
      const notifications = reminders
        .filter(r => r.enabled)
        .map(reminder => {
          const now = new Date();
          const scheduledDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            reminder.hour,
            reminder.minute,
            0
          );

          // If the time has passed today, schedule for tomorrow
          if (scheduledDate <= now) {
            scheduledDate.setDate(scheduledDate.getDate() + 1);
          }

          return {
            title: "Keep Your Streak! 🔥",
            body: "Don't forget your daily Bible reading to maintain your streak!",
            id: 1000 + reminder.id,
            schedule: {
              at: scheduledDate,
              repeats: true,
              every: 'day' as const,
            },
          };
        });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} streak reminders`);
      }
    } catch (error) {
      console.log('Error scheduling streak reminders:', error);
    }
  };

  const updateStreakReminders = async (reminders: ReminderTime[]) => {
    localStorage.setItem('streakReminders', JSON.stringify(reminders));
    await scheduleStreakReminders();
  };

  const getStreakReminders = (): ReminderTime[] => {
    const saved = localStorage.getItem('streakReminders');
    return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  };

  return { 
    scheduleNotification, 
    scheduleStreakReminders,
    updateStreakReminders,
    getStreakReminders,
  };
};
