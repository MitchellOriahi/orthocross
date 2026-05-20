import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2 } from "lucide-react";
import { getVerseOfTheDay } from "@/lib/verseOfTheDay";
import { VerseShareDialog } from "@/components/VerseShareDialog";

export const VerseOfTheDay = () => {
  const [verse, setVerse] = useState<{ reference: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const loadVerseOfTheDay = () => {
      const todaysVerse = getVerseOfTheDay();
      setVerse(todaysVerse);
      setLoading(false);
    };

    loadVerseOfTheDay();

    const checkMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const timeUntilMidnight = midnight.getTime() - now.getTime();

      return setTimeout(() => {
        loadVerseOfTheDay();
        setInterval(loadVerseOfTheDay, 24 * 60 * 60 * 1000);
      }, timeUntilMidnight);
    };

    const midnightTimer = checkMidnight();
    return () => clearTimeout(midnightTimer);
  }, []);

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Verse of the Day</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShareOpen(true)}
            aria-label="Share verse of the day"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-lg italic mb-4">&ldquo;{verse?.text}&rdquo;</p>
          <p className="text-sm text-muted-foreground font-semibold">— {verse?.reference}</p>
        </CardContent>
      </Card>

      {verse && (
        <VerseShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          verseText={verse.text}
          verseReference={verse.reference}
        />
      )}
    </>
  );
};
