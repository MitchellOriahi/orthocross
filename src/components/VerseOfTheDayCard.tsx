import { useEffect, useState } from "react";
import { BookOpen, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerseShareDialog } from "@/components/VerseShareDialog";
import { supabase } from "@/integrations/supabase/client";

interface DailyVerse {
  reference: string;
  verse_text: string;
}

export const VerseOfTheDayCard = () => {
  const cacheKey = `board_daily_verse_${new Date().toDateString()}`;
  const [verse, setVerse] = useState<DailyVerse | null>(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let active = true;
    // The generated function types predate the daily verse RPC.
    const getDailyVerse = supabase.rpc as unknown as (
      name: "get_verse_of_the_day"
    ) => PromiseLike<{ data: DailyVerse[] | null; error: unknown }>;
    getDailyVerse("get_verse_of_the_day").then(({ data, error }) => {
      if (error) {
        console.error("Error loading verse of the day:", error);
        return;
      }
      const dailyVerse = data?.[0];
      if (!active || !dailyVerse) return;
      setVerse(dailyVerse);
      try { sessionStorage.setItem(cacheKey, JSON.stringify(dailyVerse)); } catch {}
    });
    return () => { active = false; };
  }, [cacheKey]);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Verse of the Day
            </span>
            <Button variant="ghost" size="icon" disabled={!verse} onClick={() => setShareOpen(true)} aria-label="Share Verse of the Day" title="Share Verse of the Day">
              <Share2 className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {verse ? (
            <>
              <blockquote className="font-serif text-lg leading-relaxed">“{verse.verse_text}”</blockquote>
              <p className="text-sm font-medium text-primary uppercase">{verse.reference}</p>
            </>
          ) : (
            <>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-28" />
            </>
          )}
        </CardContent>
      </Card>
      {verse && <VerseShareDialog open={shareOpen} onOpenChange={setShareOpen} verseText={verse.verse_text} verseReference={verse.reference} />}
    </>
  );
};