import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2 } from "lucide-react";
import { getVerseOfTheDay, localDateKey } from "@/lib/verseOfTheDay";
import { supabase } from "@/integrations/supabase/client";
import { VerseShareDialog } from "@/components/VerseShareDialog";

export const VerseOfTheDayCard = () => {
  const [verse, setVerse] = useState<{ reference: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadVerseOfTheDay = () => {
      const now = new Date();
      setVerse(getVerseOfTheDay(now));
      setLoading(false);
      // The backend list is the source of truth shared with notifications and widgets.
      supabase.rpc("get_verse_of_the_day", { p_date: localDateKey(now) }).then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data;
        if (cancelled || !row?.reference || !row?.verse_text) return;
        setVerse((current) =>
          current?.reference === row.reference && current?.text === row.verse_text
            ? current
            : { reference: row.reference, text: row.verse_text });
      }, () => { /* keep the bundled verse when offline */ });
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
    return () => {
      cancelled = true;
      clearTimeout(midnightTimer);
    };
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
      <Card
        role="button"
        tabIndex={0}
        aria-label="Share verse of the day"
        onClick={() => setShareOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShareOpen(true);
          }
        }}
        className="cursor-pointer select-none transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle>Verse of the Day</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShareOpen(true);
            }}
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
