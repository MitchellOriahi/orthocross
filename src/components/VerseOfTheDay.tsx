import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";
import { getVerseOfTheDay } from "@/lib/verseOfTheDay";

export const VerseOfTheDay = () => {
  const [verse, setVerse] = useState<{ reference: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { scheduleNotification } = useNotifications();

  useEffect(() => {
    const loadVerseOfTheDay = () => {
      const todaysVerse = getVerseOfTheDay();
      setVerse(todaysVerse);
      setLoading(false);
      
      // Schedule notification for the verse
      scheduleNotification(
        "Verse of the Day",
        `${todaysVerse.text} — ${todaysVerse.reference}`
      );
    };

    loadVerseOfTheDay();

    // Check for midnight and refresh verse
    const checkMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = midnight.getTime() - now.getTime();
      
      return setTimeout(() => {
        loadVerseOfTheDay();
        // Set up daily interval after first midnight
        setInterval(loadVerseOfTheDay, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
    };

    const midnightTimer = checkMidnight();
    
    return () => {
      clearTimeout(midnightTimer);
    };
  }, [scheduleNotification]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verse of the Day</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verse of the Day</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg italic mb-4">&ldquo;{verse?.text}&rdquo;</p>
        <p className="text-sm text-muted-foreground font-semibold">— {verse?.reference}</p>
      </CardContent>
    </Card>
  );
};
