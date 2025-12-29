import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getVerseOfTheDay } from '@/lib/verseOfTheDay';
import { supabase } from '@/integrations/supabase/client';
import { getAllFastingEvents } from '@/data/fastingEvents';

export interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const DEFAULT_REMINDERS: ReminderTime[] = [
  { id: '1', hour: 12, minute: 0, enabled: false }, // Verse of the day at noon (off by default)
  { id: '2', hour: 18, minute: 0, enabled: true }, // Streak reminder at 6pm
];

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

          // Determine notification based on time
          let title = "";
          let body = "";
          
          if (reminder.hour === 12) {
            // Verse of the day at noon
            const verse = getVerseOfTheDay(scheduledDate);
            title = "Verse of the Day";
            body = `${verse.reference} - ${verse.text}`;
          } else if (reminder.hour === 18) {
            // Streak reminder at 6pm
            title = "Keep Your Streak! 🔥";
            body = "Don't forget your daily Bible reading to maintain your streak!";
          }

          return {
            title,
            body,
            id: parseInt(`1000${reminder.id}`, 10),
            schedule: {
              at: scheduledDate,
              repeats: true,
              every: 'day' as const,
            },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#8B4513',
            channelId: 'orthocross-reminders',
          };
        });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} daily reminders`);
      }
    } catch (error) {
      console.log('Error scheduling reminders:', error);
    }
  };

  const scheduleFastingReminder = async (
    eventName: string, 
    eventType: string, 
    tradition: string, 
    date: Date,
    reminderDaysBefore: number = 0
  ) => {
    try {
      const notifications = [];
      const eventDate = new Date(date);
      eventDate.setHours(0, 0, 0, 0);
      
      // Calculate how many days until the event
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntilEvent = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Schedule notifications based on preference
      if (reminderDaysBefore === 0) {
        // Only on the day of
        const title = eventType === "fast" ? "🕊️ Fast Beginning Today" : "✨ Feast Day Today";
        const body = eventType === "fast"
          ? `${eventName} begins today (${tradition}). Remember to observe the fast.`
          : `Today is ${eventName} (${tradition}). May you have a blessed feast day!`;
        
        notifications.push({
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: eventDate },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
          iconColor: '#8B4513',
          channelId: 'orthocross-fasting',
        });
      } else {
        // Schedule daily reminders for the specified number of days before
        for (let i = reminderDaysBefore; i >= 0; i--) {
          const notificationDate = new Date(eventDate);
          notificationDate.setDate(notificationDate.getDate() - i);
          
          // Skip if the date is in the past
          if (notificationDate < today) continue;
          
          let title: string;
          let body: string;
          
          if (i === 0) {
            // Day of the event
            title = eventType === "fast" ? "🕊️ Fast Beginning Today" : "✨ Feast Day Today";
            body = eventType === "fast"
              ? `${eventName} begins today (${tradition}). Remember to observe the fast.`
              : `Today is ${eventName} (${tradition}). May you have a blessed feast day!`;
          } else {
            // Days before
            const daysText = i === 1 ? "1 day" : `${i} days`;
            title = eventType === "fast" ? "🕊️ Upcoming Fast" : "✨ Upcoming Feast";
            body = `${daysText} until ${eventName} (${tradition})`;
          }
          
          notifications.push({
            title,
            body,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: notificationDate },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#8B4513',
            channelId: 'orthocross-fasting',
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} notification(s) for ${eventName}`);
      }
    } catch (error) {
      console.log('Error scheduling fasting reminder:', error);
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

  const scheduleAllFastingReminders = async (userId: string) => {
    try {
      // Get user's fasting preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('fasting_reminder_days, fasting_notifications_enabled, wednesday_notifications_enabled')
        .eq('id', userId)
        .single();

      if (!profile?.fasting_notifications_enabled) {
        console.log('Fasting notifications disabled');
        return;
      }

      // Get all fasting/feast events for the current year
      const currentYear = new Date().getFullYear();
      const events = getAllFastingEvents(currentYear);
      
      // Use all events (both Eastern and Oriental traditions)
      const filteredEvents = events;

      // Cancel existing fasting notifications (IDs 2000-2999)
      const cancelIds = Array.from({ length: 1000 }, (_, i) => ({ id: 2000 + i }));
      await LocalNotifications.cancel({ notifications: cancelIds });

      // Schedule notifications for each major event
      const majorEvents = filteredEvents.filter(e => e.isMajor);
      
      for (const event of majorEvents) {
        const eventDate = new Date(currentYear, event.month - 1, event.day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Only schedule if event is in the future
        if (eventDate < today) continue;

        // Schedule based on user's preference
        const reminderDays = profile.fasting_reminder_days || [3, 0];
        
        for (const daysBefore of reminderDays) {
          await scheduleFastingReminder(
            event.name,
            event.type,
            event.tradition,
            eventDate,
            daysBefore
          );
        }
      }

      // Handle Wednesday fasting notifications if enabled
      if (profile.wednesday_notifications_enabled) {
        await scheduleWednesdayReminders();
      }

      console.log(`Scheduled fasting reminders for ${majorEvents.length} events`);
    } catch (error) {
      console.log('Error scheduling fasting reminders:', error);
    }
  };

  const scheduleWednesdayReminders = async () => {
    try {
      // Schedule Wednesday fasting reminders for the next 12 weeks
      const notifications = [];
      const today = new Date();
      
      for (let i = 0; i < 12; i++) {
        const nextWednesday = new Date(today);
        nextWednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7) + (i * 7));
        nextWednesday.setHours(8, 0, 0, 0); // 8 AM reminder
        
        if (nextWednesday > today) {
          notifications.push({
            title: "🕊️ Wednesday Fast",
            body: "Today is Wednesday. Remember to observe the fast.",
            id: 3000 + i,
            schedule: { at: nextWednesday },
            sound: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#8B4513',
            channelId: 'orthocross-fasting',
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} Wednesday fast reminders`);
      }
    } catch (error) {
      console.log('Error scheduling Wednesday reminders:', error);
    }
  };

  return { 
    scheduleNotification, 
    scheduleStreakReminders,
    scheduleFastingReminder,
    scheduleAllFastingReminders,
    updateStreakReminders,
    getStreakReminders,
  };
};
