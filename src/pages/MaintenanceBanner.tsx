import { useEffect, useState } from "react";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { Sparkles } from "lucide-react";

const RELEASE_DATE = new Date("2026-05-14T00:00:00");

const MaintenanceBanner = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const diff = RELEASE_DATE.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen gradient-peaceful flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-foreground/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Cross icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-foreground dark:bg-background rounded-2xl shadow-sacred p-3 mx-auto animate-fade-in">
          <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/60 backdrop-blur-sm text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Massive Update In Progress</span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight font-serif">
            OrthoCross 2.0
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">
            Releasing May 14th
          </p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            We're rebuilding OrthoCross from the ground up to bring you a faster,
            richer, and more beautiful experience for your daily Orthodox spiritual
            practice. Thank you for your patience as we prepare something truly special.
          </p>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto pt-4">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-3 sm:p-4 shadow-elevated"
            >
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                {unit.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            Follow <span className="font-semibold text-foreground">@orthocross</span> on Instagram for updates
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 OrthoCross App
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
