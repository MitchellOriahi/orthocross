import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllFastingEvents, createDateFromEvent, type CalendarSystem } from "@/data/fastingEvents";

interface FastingEvent {
  name: string;
  date: Date;
  endDate?: Date; // For multi-day fasts
  tradition: string;
  type: "fast" | "feast" | "holiday";
}

// Convert shared data to calendar format
const getFixedFastingEvents = (year: number, calendarSystem: CalendarSystem): FastingEvent[] => {
  const events = getAllFastingEvents(year, calendarSystem);
  
  return events.map(event => {
    const startDate = createDateFromEvent(year, event.month, event.day);
    let endDate: Date | undefined;
    
    if (event.endMonth !== undefined && event.endDay !== undefined) {
      // Handle year boundary crossing (e.g., Nativity Fast)
      const endYear = event.endMonth < event.month ? year + 1 : year;
      endDate = createDateFromEvent(endYear, event.endMonth, event.endDay);
    }
    
    return {
      name: event.name,
      date: startDate,
      endDate,
      tradition: event.tradition,
      type: event.type
    };
  });
};

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
      const matchesTradition = event.tradition === (selectedTradition === "Eastern Orthodox" ? "Eastern" : "Oriental") || event.tradition === "Both";
      
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
      const hasHoliday = events.some(e => e.type === "holiday");
      
      days.push(
        <div
          key={day}
          className={`h-20 border border-border/50 p-1 overflow-hidden ${
            hasFeast 
              ? "bg-blue-200 dark:bg-blue-900/50" 
              : hasFast 
                ? "bg-red-200 dark:bg-red-900/50"
                : hasHoliday
                  ? "bg-amber-200 dark:bg-amber-900/50"
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
                    : event.type === "holiday"
                      ? "text-amber-900 dark:text-amber-100"
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
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-amber-200 dark:bg-amber-900/50 border border-amber-400 dark:border-amber-700" />
            <span>{traditionIcon} Holiday</span>
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
