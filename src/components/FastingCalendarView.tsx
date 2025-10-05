import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FastingEvent {
  name: string;
  date: Date;
  tradition: string;
  type: "fast" | "feast";
}

const fastingEvents: FastingEvent[] = [
  // Eastern Orthodox Fasts & Feasts
  { name: "Nativity Fast", date: new Date(2025, 10, 15), tradition: "Eastern", type: "fast" },
  { name: "Nativity", date: new Date(2025, 11, 25), tradition: "Eastern", type: "feast" },
  { name: "Theophany", date: new Date(2026, 0, 6), tradition: "Eastern", type: "feast" },
  { name: "Presentation", date: new Date(2025, 1, 2), tradition: "Eastern", type: "feast" },
  { name: "Annunciation", date: new Date(2025, 2, 25), tradition: "Eastern", type: "feast" },
  { name: "Palm Sunday", date: new Date(2025, 3, 13), tradition: "Eastern", type: "feast" },
  { name: "Pascha", date: new Date(2025, 3, 20), tradition: "Eastern", type: "feast" },
  { name: "Ascension", date: new Date(2025, 4, 29), tradition: "Eastern", type: "feast" },
  { name: "Pentecost", date: new Date(2025, 5, 8), tradition: "Eastern", type: "feast" },
  { name: "Transfiguration", date: new Date(2025, 7, 6), tradition: "Eastern", type: "feast" },
  { name: "Dormition Fast", date: new Date(2025, 7, 1), tradition: "Eastern", type: "fast" },
  { name: "Dormition", date: new Date(2025, 7, 15), tradition: "Eastern", type: "feast" },
  { name: "Nativity of Theotokos", date: new Date(2025, 8, 8), tradition: "Eastern", type: "feast" },
  { name: "Elevation of Cross", date: new Date(2025, 8, 14), tradition: "Eastern", type: "feast" },
  
  // Oriental Orthodox
  { name: "Nativity Fast", date: new Date(2025, 10, 25), tradition: "Oriental", type: "fast" },
  { name: "Nativity", date: new Date(2026, 0, 7), tradition: "Oriental", type: "feast" },
  { name: "Nineveh Fast", date: new Date(2025, 1, 3), tradition: "Oriental", type: "fast" },
  { name: "Great Lent", date: new Date(2025, 1, 10), tradition: "Oriental", type: "fast" },
];

// Add weekly fasting days
const getWeeklyFastDays = (month: number, year: number) => {
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    
    // Wednesday (3) and Friday (5) are fasting days
    if (dayOfWeek === 3 || dayOfWeek === 5) {
      days.push(day);
    }
  }
  
  return days;
};

export const FastingCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const weeklyFasts = getWeeklyFastDays(currentMonth, currentYear);

  const getEventsForDay = (day: number) => {
    return fastingEvents.filter(event => {
      return event.date.getDate() === day &&
             event.date.getMonth() === currentMonth &&
             event.date.getFullYear() === currentYear;
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-border/50" />);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const events = getEventsForDay(day);
      const isWeeklyFast = weeklyFasts.includes(day);
      const hasFeast = events.some(e => e.type === "feast");
      const hasFast = events.some(e => e.type === "fast");
      const hasEastern = events.some(e => e.tradition === "Eastern");
      
      days.push(
        <div
          key={day}
          className={`h-20 border border-border/50 p-1 overflow-hidden ${
            hasFeast 
              ? hasEastern
                ? "bg-blue-200 dark:bg-blue-900/50" 
                : "bg-blue-100 dark:bg-blue-950/30"
              : hasFast 
                ? hasEastern
                  ? "bg-red-200 dark:bg-red-900/50"
                  : "bg-red-100 dark:bg-red-950/30"
                : isWeeklyFast 
                  ? "bg-red-50 dark:bg-red-950/20" 
                  : "bg-background"
          }`}
        >
          <div className="font-semibold text-sm">{day}</div>
          <div className="space-y-0.5 mt-1">
            {events.map((event, idx) => (
              <div
                key={idx}
                className={`text-[10px] truncate font-medium ${
                  event.type === "feast" 
                    ? "text-blue-900 dark:text-blue-100" 
                    : "text-red-900 dark:text-red-100"
                }`}
              >
                {event.tradition === "Eastern" ? "⛪" : "✝️"} {event.name}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <Card className="shadow-elevated border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {monthNames[currentMonth]} {currentYear} Fasts & Feasts
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-200 dark:bg-red-900/50 border border-red-400 dark:border-red-700" />
            <span>⛪ Eastern Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800" />
            <span>✝️ Oriental Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30" />
            <span>Wed/Fri Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-700" />
            <span>⛪ Eastern Feast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800" />
            <span>✝️ Oriental Feast</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-0 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center font-semibold text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0 border border-border/50">
            {renderCalendarDays()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
