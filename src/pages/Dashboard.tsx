import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreakFlame } from "@/components/StreakFlame";
import { LessonPath } from "@/components/LessonPath";
import { DoveMascot } from "@/components/DoveMascot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Home, Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setStreakDays(data.current_streak);
      }
    };

    fetchStreak();
  }, [user]);
  
  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DoveMascot size="sm" />
              <h1 className="text-2xl font-bold gradient-sacred bg-clip-text text-transparent">
                Orthodox Companion
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                <Home className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Streak Section */}
        <section className="flex justify-center py-4">
          <StreakFlame days={streakDays} size="lg" />
        </section>

        {/* Lesson Path - Duolingo Style */}
        <section className="py-4">
          <h2 className="text-2xl font-bold text-center mb-8">Your Learning Path</h2>
          <LessonPath />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
