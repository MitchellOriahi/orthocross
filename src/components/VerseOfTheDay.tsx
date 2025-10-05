import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const SAMPLE_VERSES = [
  { reference: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
  { reference: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { reference: "Isaiah 41:10", text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand." },
  { reference: "Matthew 11:28", text: "Come to me, all who labor and are heavy laden, and I will give you rest." },
  { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
];

export const VerseOfTheDay = () => {
  const [verse, setVerse] = useState<{ reference: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerseOfTheDay = async () => {
      const today = new Date().toISOString().split('T')[0];

      // Try to get today's verse from the database
      const { data, error } = await supabase
        .from('verse_of_the_day')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (data) {
        setVerse({ reference: data.verse_reference, text: data.verse_text });
        setLoading(false);
        return;
      }

      // If no verse for today, generate a new one
      const randomVerse = SAMPLE_VERSES[Math.floor(Math.random() * SAMPLE_VERSES.length)];
      
      // Save it to the database
      await supabase
        .from('verse_of_the_day')
        .insert({
          verse_reference: randomVerse.reference,
          verse_text: randomVerse.text,
          date: today
        });

      setVerse(randomVerse);
      setLoading(false);
    };

    loadVerseOfTheDay();
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
