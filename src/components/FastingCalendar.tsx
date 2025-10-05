import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Bell, BellOff, ChevronDown, ChevronUp, Church } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import { FastingCalendarView } from "./FastingCalendarView";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface FastingEvent {
  name: string;
  startDate: string;
  endDate?: string;
  tradition: string;
  type: "fast" | "feast";
  isMajor: boolean;
}

const fastingEvents: FastingEvent[] = [
  // Eastern Orthodox Fasts
  { name: "Nativity Fast", startDate: "November 15", endDate: "December 24", tradition: "Eastern Orthodox", type: "fast", isMajor: true },
  { name: "Great Lent", startDate: "March 3", endDate: "April 19", tradition: "Eastern Orthodox", type: "fast", isMajor: true },
  { name: "Apostles' Fast", startDate: "June 15", endDate: "June 28", tradition: "Eastern Orthodox", type: "fast", isMajor: true },
  { name: "Dormition Fast", startDate: "August 1", endDate: "August 14", tradition: "Eastern Orthodox", type: "fast", isMajor: true },
  
  // Oriental Orthodox Fasts
  { name: "Nativity Fast", startDate: "November 25", endDate: "January 6", tradition: "Oriental Orthodox", type: "fast", isMajor: true },
  { name: "Nineveh Fast", startDate: "February 3", endDate: "February 5", tradition: "Oriental Orthodox", type: "fast", isMajor: true },
  { name: "Great Lent", startDate: "February 10", endDate: "April 5", tradition: "Oriental Orthodox", type: "fast", isMajor: true },
  { name: "Apostles' Fast", startDate: "June 16", endDate: "July 11", tradition: "Oriental Orthodox", type: "fast", isMajor: true },
  { name: "Dormition Fast", startDate: "August 7", endDate: "August 21", tradition: "Oriental Orthodox", type: "fast", isMajor: true },
  
  // Major Feasts (Eastern & Oriental)
  { name: "Nativity of Christ", startDate: "December 25", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Theophany (Epiphany)", startDate: "January 6", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Nativity of Christ", startDate: "January 7", tradition: "Oriental Orthodox", type: "feast", isMajor: true },
  { name: "Presentation of Christ", startDate: "February 2", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Annunciation", startDate: "March 25", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Palm Sunday", startDate: "April 13", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Pascha (Easter)", startDate: "April 20", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Ascension", startDate: "May 29", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Pentecost", startDate: "June 8", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Transfiguration", startDate: "August 6", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Dormition of Theotokos", startDate: "August 15", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Nativity of Theotokos", startDate: "September 8", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
  { name: "Elevation of the Cross", startDate: "September 14", tradition: "Eastern Orthodox", type: "feast", isMajor: true },
];

export const FastingCalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<"Eastern Orthodox" | "Oriental Orthodox">("Eastern Orthodox");
  const { scheduleNotification } = useNotifications();

  useEffect(() => {
    const saved = localStorage.getItem('fastingReminders');
    if (saved) {
      setReminders(new Set(JSON.parse(saved)));
    }
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getMonthEvents = (month: number) => {
    const events = fastingEvents.filter(event => {
      const eventDates = event.endDate ? [event.startDate, event.endDate] : [event.startDate];
      const eventMonths = eventDates.map(date => {
        const monthStr = date.split(' ')[0];
        return monthNames.indexOf(monthStr);
      });
      
      return eventMonths.some(m => m === month) && event.tradition === selectedTradition;
    });
    
    // Sort by type (feasts then fasts), then by date
    return events.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "feast" ? -1 : 1;
      }
      return 0;
    });
  };

  const toggleReminder = async (event: FastingEvent) => {
    const eventKey = `${event.name}-${event.startDate}-${event.tradition}`;
    const newReminders = new Set(reminders);
    
    if (reminders.has(eventKey)) {
      newReminders.delete(eventKey);
      toast.success("Reminder removed");
    } else {
      newReminders.add(eventKey);
      
      // Schedule notification for midnight on the start date
      const [monthStr, dayStr] = event.startDate.split(' ');
      const month = monthNames.indexOf(monthStr);
      const day = parseInt(dayStr);
      const notifDate = new Date(selectedYear, month, day, 0, 0, 0);
      
      if (notifDate > new Date()) {
        await scheduleNotification(
          event.type === "fast" ? "Fast Beginning" : "Feast Day",
          `${event.name} begins today (${event.tradition})`,
          notifDate
        );
        toast.success("Reminder set");
      } else {
        toast.error("Date has passed");
        return;
      }
    }
    
    setReminders(newReminders);
    localStorage.setItem('fastingReminders', JSON.stringify(Array.from(newReminders)));
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthEvents = getMonthEvents(selectedMonth);
  const displayMonthName = monthNames[selectedMonth];

  return (
    <div className="space-y-4">
      <Card className="shadow-elevated border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {displayMonthName} {selectedYear} Fasts & Feasts
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
          
          {/* Tradition Selector */}
          <RadioGroup
            value={selectedTradition}
            onValueChange={(value) => setSelectedTradition(value as "Eastern Orthodox" | "Oriental Orthodox")}
            className="flex gap-4 mt-5"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Eastern Orthodox" id="eastern" />
              <Label htmlFor="eastern" className="cursor-pointer flex items-center gap-1.5">
                <Church className="w-4 h-4" /> Eastern Orthodox
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Oriental Orthodox" id="oriental" />
              <Label htmlFor="oriental" className="cursor-pointer flex items-center gap-1.5">
                <Church className="w-4 h-4" /> Oriental Orthodox
              </Label>
            </div>
          </RadioGroup>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {monthEvents.length > 0 ? (
            monthEvents.map((event, index) => {
              const eventKey = `${event.name}-${event.startDate}-${event.tradition}`;
              const hasReminder = reminders.has(eventKey);
              const isEastern = event.tradition === "Eastern Orthodox";
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-2 space-y-2 ${
                    event.type === "fast" 
                      ? isEastern
                        ? "bg-red-100 dark:bg-red-900/40 border-red-400 dark:border-red-700" 
                        : "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800"
                      : isEastern
                        ? "bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-700"
                        : "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <h4 className={`font-semibold ${
                        event.type === "fast" 
                          ? "text-red-900 dark:text-red-100" 
                          : "text-blue-900 dark:text-blue-100"
                      }`}>
                        {event.name}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs w-fit ${
                          isEastern 
                            ? "bg-amber-100 dark:bg-amber-900/40 border-amber-500 text-amber-900 dark:text-amber-100" 
                            : "bg-purple-100 dark:bg-purple-900/40 border-purple-500 text-purple-900 dark:text-purple-100"
                        }`}
                      >
                        {isEastern ? "⛪ Eastern Orthodox" : "✝️ Oriental Orthodox"}
                      </Badge>
                    </div>
                    {event.isMajor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleReminder(event)}
                      >
                        {hasReminder ? (
                          <Bell className="w-3 h-3" />
                        ) : (
                          <BellOff className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${
                    event.type === "fast" 
                      ? "text-red-800 dark:text-red-200" 
                      : "text-blue-800 dark:text-blue-200"
                  }`}>
                    {event.endDate ? `${event.startDate} - ${event.endDate}` : event.startDate}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fasts or feasts this month
            </p>
          )}
          
          {/* Toggle Calendar View Button */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowCalendarView(!showCalendarView)}
          >
            {showCalendarView ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Calendar View
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show Calendar View
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Collapsible Calendar View */}
      {showCalendarView && (
        <FastingCalendarView 
          selectedTradition={selectedTradition}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}
    </div>
  );
};
