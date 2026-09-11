import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VerseShareDialog } from "@/components/VerseShareDialog";

interface DailyVerse {
  reference: string;
  verse_text: string;
}

export const VerseOfTheDayCard = () => {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    // Types file predates the daily_verses migration, hence the cast
    (supabase.rpc as any)("get_verse_of_the_day").then(
      ({ data, error }: { data: DailyVerse[] | null; error: unknown }) => {
        if (error) {
          console.error("Error loading verse of the day:", error);
          return;
        }
        if (data && data.length > 0) setVerse(data[0]);
      }
    );
  }, []);

  if (!verse) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Verse of the Day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-sacred active:scale-[0.99]"
        onClick={() => setShareOpen(true)}
        role="button"
        aria-label={`Verse of the day, ${verse.reference}. Tap to view and share.`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Verse of the Day
            </span>
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <blockquote className="font-serif text-lg leading-relaxed">
            “{verse.verse_text}”
          </blockquote>
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            {verse.reference}
          </p>
          <p className="text-xs text-muted-foreground">
            Tap to open as a shareable image
          </p>
        </CardContent>
      </Card>

      <VerseShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        verseText={verse.verse_text}
        verseReference={verse.reference}
      />
    </>
  );
};
