import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StreakFlame } from "@/components/StreakFlame";
import { DailyReadingCard } from "@/components/DailyReadingCard";
import { FastingCalendar } from "@/components/FastingCalendar";
import { Book, Home, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [streakDays] = useState(7);
  
  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center p-1">
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">OrthoCross App</h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <Home className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Streak Section */}
        <section className="flex justify-center py-8">
          <StreakFlame days={streakDays} size="lg" />
        </section>

        {/* Today's Reading */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Today's Reading</h2>
          <DailyReadingCard
            title="Gospel of John"
            passage="John 3:1-21"
            progress={0}
            onStartReading={() => navigate('/reading')}
          />
        </section>

        {/* Additional Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reading Plan Overview */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">This Week's Progress</h2>
            <div className="grid gap-3">
              <DailyReadingCard
                title="Monday - Psalms"
                passage="Psalm 23"
                completed={true}
              />
              <DailyReadingCard
                title="Tuesday - Proverbs"
                passage="Proverbs 3:1-12"
                completed={true}
              />
            </div>
          </div>

          {/* Fasting Calendar */}
          <FastingCalendar />
        </div>

        {/* Quick Actions */}
        <section className="flex flex-wrap gap-4 justify-center py-8">
          <Button variant="outline" size="lg" onClick={() => navigate('/reading')}>
            <BookOpen className="w-5 h-5" />
            Browse Scripture
          </Button>
          <Button variant="outline" size="lg">
            <Book className="w-5 h-5" />
            Study Resources
          </Button>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
