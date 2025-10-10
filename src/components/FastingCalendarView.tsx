import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FastingEvent {
  name: string;
  date: Date;
  endDate?: Date; // For multi-day fasts
  tradition: string;
  type: "fast" | "feast";
}

// Fixed date events (month, day) - will work for any year
const getFixedFastingEvents = (year: number): FastingEvent[] => [
  // Eastern Orthodox Fasts & Feasts
  { name: "Nativity Fast", date: new Date(year, 10, 15), endDate: new Date(year, 11, 24), tradition: "Eastern", type: "fast" },
  { name: "Nativity", date: new Date(year, 11, 25), tradition: "Eastern", type: "feast" },
  { name: "Theophany", date: new Date(year, 0, 6), tradition: "Eastern", type: "feast" },
  { name: "Presentation", date: new Date(year, 1, 2), tradition: "Eastern", type: "feast" },
  { name: "Annunciation", date: new Date(year, 2, 25), tradition: "Eastern", type: "feast" },
  { name: "Transfiguration", date: new Date(year, 7, 6), tradition: "Eastern", type: "feast" },
  { name: "Dormition Fast", date: new Date(year, 7, 1), endDate: new Date(year, 7, 14), tradition: "Eastern", type: "fast" },
  { name: "Dormition", date: new Date(year, 7, 15), tradition: "Eastern", type: "feast" },
  { name: "Nativity of Theotokos", date: new Date(year, 8, 8), tradition: "Eastern", type: "feast" },
  { name: "Elevation of Cross", date: new Date(year, 8, 14), tradition: "Eastern", type: "feast" },
  
  // Oriental Orthodox
  { name: "Nativity Fast", date: new Date(year, 10, 25), endDate: new Date(year, 0, 6), tradition: "Oriental", type: "fast" },
  { name: "Nativity", date: new Date(year, 0, 7), tradition: "Oriental", type: "feast" },
  { name: "Nineveh Fast", date: new Date(year, 1, 3), endDate: new Date(year, 1, 5), tradition: "Oriental", type: "fast" },
  { name: "Great Lent", date: new Date(year, 1, 10), endDate: new Date(year, 3, 19), tradition: "Oriental", type: "fast" },
  
  // Moveable feasts approximations for Eastern (2025 values, would need calculation for other years)
  ...(year === 2025 ? [
    { name: "Great Lent", date: new Date(2025, 2, 3), endDate: new Date(2025, 3, 19), tradition: "Eastern", type: "fast" as const },
    { name: "Palm Sunday", date: new Date(2025, 3, 13), tradition: "Eastern", type: "feast" as const },
    { name: "Pascha", date: new Date(2025, 3, 20), tradition: "Eastern", type: "feast" as const },
    { name: "Ascension", date: new Date(2025, 4, 29), tradition: "Eastern", type: "feast" as const },
    { name: "Pentecost", date: new Date(2025, 5, 8), tradition: "Eastern", type: "feast" as const },
  ] : []),
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

interface FastingCalendarViewProps {
  selectedTradition: "Eastern Orthodox" | "Oriental Orthodox";
  selectedMonth: number;
  selectedYear: number;
}

export const FastingCalendarView = ({ selectedTradition, selectedMonth, selectedYear }: FastingCalendarViewProps) => {
  const currentMonth = selectedMonth;
  const currentYear = selectedYear;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const weeklyFasts = getWeeklyFastDays(currentMonth, currentYear);
  const fastingEvents = getFixedFastingEvents(currentYear);

  const getEventsForDay = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    
    return fastingEvents.filter(event => {
      const matchesTradition = event.tradition === (selectedTradition === "Eastern Orthodox" ? "Eastern" : "Oriental");
      
      if (!matchesTradition) return false;
      
      // Check if it's a multi-day event (fasting period)
      if (event.endDate) {
        return checkDate >= event.date && checkDate <= event.endDate;
      }
      
      // Single day event
      return event.date.getDate() === day &&
             event.date.getMonth() === currentMonth &&
             event.date.getFullYear() === currentYear;
    });
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
      
      days.push(
        <div
          key={day}
          className={`h-20 border border-border/50 p-1 overflow-hidden ${
            hasFeast 
              ? "bg-blue-200 dark:bg-blue-900/50" 
              : hasFast 
                ? "bg-red-200 dark:bg-red-900/50"
                : isWeeklyFast 
                  ? "bg-purple-100 dark:bg-purple-950/30" 
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
                {event.name}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const traditionIcon = "⛪";

  return (
    <Card className="shadow-elevated border-border/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          {traditionIcon} {monthNames[currentMonth]} {currentYear} - {selectedTradition}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-200 dark:bg-red-900/50 border border-red-400 dark:border-red-700" />
            <span>{traditionIcon} Major Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-100 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800/40" />
            <span>Wed/Fri Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900/50 border border-blue-400 dark:border-blue-700" />
            <span>{traditionIcon} Feast Day</span>
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
