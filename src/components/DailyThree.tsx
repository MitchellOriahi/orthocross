import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, BookOpen, HandHeart, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticTap } from "@/utils/haptics";
import { cn } from "@/lib/utils";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const startOfTodayISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
};

export const DailyThree = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readingDone, setReadingDone] = useState(false);
  const [reflectionDone, setReflectionDone] = useState(false);
  const [prayerDone, setPrayerDone] = useState(false);

  useEffect(() => {
    if (!user) return;

    try {
      setPrayerDone(localStorage.getItem(`daily_prayer_${user.id}_${todayKey()}`) === '1');
    } catch {}

    const since = startOfTodayISO();
    supabase
      .from('completed_chapters')
      .select('id')
      .eq('user_id', user.id)
      .gte('completed_at', since)
      .limit(1)
      .then(({ data }) => setReadingDone(!!data?.length));

    (supabase as any)
      .from('journal_entries')
      .select('id')
      .eq('user_id', user.id)
      .gte('updated_at', since)
      .limit(1)
      .then(({ data }: { data: { id: string }[] | null }) => setReflectionDone(!!data?.length));
  }, [user]);

  const handlePray = () => {
    hapticTap();
    if (user) {
      try { localStorage.setItem(`daily_prayer_${user.id}_${todayKey()}`, '1'); } catch {}
    }
    setPrayerDone(true);
    navigate('/church-resources');
  };

  const handleReflect = () => {
    hapticTap();
    document.getElementById('journal-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const doneCount = [readingDone, prayerDone, reflectionDone].filter(Boolean).length;

  const items = [
    {
      label: "Read today's chapter",
      icon: BookOpen,
      done: readingDone,
      onClick: () => { hapticTap(); navigate('/index'); },
    },
    {
      label: "Pray",
      icon: HandHeart,
      done: prayerDone,
      onClick: handlePray,
    },
    {
      label: "Reflect in your journal",
      icon: PenLine,
      done: reflectionDone,
      onClick: handleReflect,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Today's Practice</span>
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              doneCount === 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {doneCount === 3 ? "Complete ☦" : `${doneCount} of 3`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map(({ label, icon: Icon, done, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
              done
                ? "border-primary/30 bg-primary/5"
                : "border-border hover:bg-accent"
            )}
          >
            {done ? (
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
            )}
            <span className={cn("flex-1 font-medium", done && "text-muted-foreground line-through decoration-primary/40")}>
              {label}
            </span>
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
};
