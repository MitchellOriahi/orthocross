import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { getAllFastingEvents } from '@/data/fastingEvents';

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

  // Schedule streak reminder at 6pm daily
  const scheduleStreakReminders = async () => {
    try {
      // Cancel existing streak notification
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }]});

      const now = new Date();
      const scheduledDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        18, // 6pm
        0,
        0
      );

      // If 6pm has passed today, schedule for tomorrow
      if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [{
          title: "Keep Your Streak! 🔥",
          body: "Don't forget your daily Bible reading to maintain your streak!",
          id: 1001,
          schedule: {
            at: scheduledDate,
            repeats: true,
            every: 'day' as const,
          },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
          iconColor: '#8B4513',
          channelId: 'orthocross-reminders',
        }],
      });
      console.log('Scheduled streak reminder at 6pm daily');
    } catch (error) {
      console.log('Error scheduling streak reminder:', error);
    }
  };

  // Schedule fasting reminder at 8pm the night before
  const scheduleFastingReminder = async (
    eventName: string, 
    eventType: string, 
    tradition: string, 
    date: Date
  ) => {
    try {
      const eventDate = new Date(date);
      eventDate.setHours(0, 0, 0, 0);
      
      // Schedule for 8pm the night before
      const notificationDate = new Date(eventDate);
      notificationDate.setDate(notificationDate.getDate() - 1);
      notificationDate.setHours(20, 0, 0, 0); // 8pm
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Skip if the notification date is in the past
      if (notificationDate < today) return;

      const title = eventType === "fast" ? "🕊️ Fast Begins Tomorrow" : "✨ Feast Day Tomorrow";
      const body = eventType === "fast"
        ? `${eventName} begins tomorrow (${tradition}). Prepare to observe the fast.`
        : `${eventName} is tomorrow (${tradition}). Prepare for the feast!`;
      
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: notificationDate },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
          iconColor: '#8B4513',
          channelId: 'orthocross-fasting',
        }],
      });
      
      console.log(`Scheduled fasting notification for ${eventName} at 8pm night before`);
    } catch (error) {
      console.log('Error scheduling fasting reminder:', error);
    }
  };

  const scheduleAllFastingReminders = async (userId: string) => {
    try {
      // Get user's fasting preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('fasting_notifications_enabled')
        .eq('id', userId)
        .single();

      if (!profile?.fasting_notifications_enabled) {
        console.log('Fasting notifications disabled');
        return;
      }

      // Get all fasting/feast events for the current year
      const currentYear = new Date().getFullYear();
      const events = getAllFastingEvents(currentYear);

      // Cancel existing fasting notifications (IDs 2000-2999)
      const cancelIds = Array.from({ length: 1000 }, (_, i) => ({ id: 2000 + i }));
      await LocalNotifications.cancel({ notifications: cancelIds });

      // Schedule notifications for each major event at 8pm the night before
      const majorEvents = events.filter(e => e.isMajor);
      
      for (const event of majorEvents) {
        const eventDate = new Date(currentYear, event.month - 1, event.day);
        await scheduleFastingReminder(
          event.name,
          event.type,
          event.tradition,
          eventDate
        );
      }

      console.log(`Scheduled fasting reminders for ${majorEvents.length} events at 8pm night before`);
    } catch (error) {
      console.log('Error scheduling fasting reminders:', error);
    }
  };

  return { 
    scheduleNotification, 
    scheduleStreakReminders,
    scheduleFastingReminder,
    scheduleAllFastingReminders,
  };
};