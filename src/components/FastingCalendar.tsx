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
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllFastingEvents, formatEventDate, type CalendarSystem } from "@/data/fastingEvents";

interface FastingEvent {
  name: string;
  startDate: string;
  endDate?: string;
  tradition: string;
  type: "fast" | "feast" | "holiday";
  isMajor: boolean;
}

export const FastingCalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reminders, setReminders] = useState<Map<string, number>>(new Map());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<"Eastern Orthodox" | "Oriental Orthodox">("Eastern Orthodox");
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>("Gregorian");
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FastingEvent | null>(null);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<string>("0");
  const { scheduleFastingReminder } = useNotifications();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Load from localStorage if not logged in
      const saved = localStorage.getItem('fastingReminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        setReminders(new Map(parsed));
      }
      return;
    }

    const { data, error } = await supabase
      .from('fasting_reminders')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading reminders:', error);
      return;
    }

    if (data) {
      const reminderMap = new Map(
        data.map(r => [
          `${r.event_name}-${r.event_date}-${r.event_tradition}`,
          r.reminder_days_before || 0
        ])
      );
      setReminders(reminderMap);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getMonthEvents = (month: number): FastingEvent[] => {
    const allEvents = getAllFastingEvents(selectedYear, calendarSystem);
    const traditionFilter = selectedTradition === "Eastern Orthodox" ? "Eastern" : "Oriental";
    
    const events = allEvents
      .filter(event => event.tradition === traditionFilter || event.tradition === "Both")
      .filter(event => {
        // Check if event falls in the selected month
        const isInMonth = event.month === month;
        const endsInMonth = event.endMonth !== undefined && event.endMonth === month;
        
        // For multi-day events, check if month is in range
        if (event.endMonth !== undefined) {
          // Handle year boundary (e.g., Nov to Jan)
          if (event.endMonth < event.month) {
            return month >= event.month || month <= event.endMonth;
          }
          return month >= event.month && month <= event.endMonth;
        }
        
        return isInMonth;
      })
      .map(event => ({
        name: event.name,
        startDate: formatEventDate(event.month, event.day),
        endDate: event.endMonth !== undefined && event.endDay !== undefined 
          ? formatEventDate(event.endMonth, event.endDay) 
          : undefined,
        tradition: selectedTradition,
        type: event.type,
        isMajor: event.isMajor
      }))
      .sort((a, b) => {
        const order: Record<string, number> = { feast: 0, holiday: 1, fast: 2 };
        return (order[a.type] ?? 3) - (order[b.type] ?? 3);
      });
    
    return events;
  };

  const handleReminderClick = (event: FastingEvent) => {
    const eventKey = `${event.name}-${event.startDate}-${event.tradition}`;
    
    if (reminders.has(eventKey)) {
      // Remove reminder
      removeReminder(event);
    } else {
      // Show dialog to select reminder preference
      setSelectedEvent(event);
      setReminderDaysBefore("0");
      setShowReminderDialog(true);
    }
  };

  const removeReminder = async (event: FastingEvent) => {
    const eventKey = `${event.name}-${event.startDate}-${event.tradition}`;
    const newReminders = new Map(reminders);
    
    // Parse the event date
    const [monthStr, dayStr] = event.startDate.split(' ');
    const month = monthNames.indexOf(monthStr);
    const day = parseInt(dayStr);
    const eventDate = new Date(selectedYear, month, day);
    const eventDateStr = eventDate.toISOString().split('T')[0];
    
    // Remove reminder
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Remove from database if logged in
      await supabase
        .from('fasting_reminders')
        .delete()
        .eq('user_id', user.id)
        .eq('event_name', event.name)
        .eq('event_date', eventDateStr)
        .eq('event_tradition', event.tradition);
    }

    newReminders.delete(eventKey);
    localStorage.setItem('fastingReminders', JSON.stringify(Array.from(newReminders)));
    setReminders(newReminders);
    toast.success("Reminder removed");
  };

  const confirmReminder = async () => {
    if (!selectedEvent) return;

    const eventKey = `${selectedEvent.name}-${selectedEvent.startDate}-${selectedEvent.tradition}`;
    const daysBefore = parseInt(reminderDaysBefore);
    
    // Parse the event date
    const [monthStr, dayStr] = selectedEvent.startDate.split(' ');
    const month = monthNames.indexOf(monthStr);
    const day = parseInt(dayStr);
    const eventDate = new Date(selectedYear, month, day);
    const eventDateStr = eventDate.toISOString().split('T')[0];
    
    // Check if date has passed
    const notifDate = new Date(selectedYear, month, day, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (notifDate <= today) {
      toast.error("Date has passed");
      setShowReminderDialog(false);
      return;
    }

    // Schedule local notifications (8pm day before is handled server-side)
    await scheduleFastingReminder(
      selectedEvent.name,
      selectedEvent.type,
      selectedEvent.tradition,
      notifDate
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Save to database if logged in
      await supabase
        .from('fasting_reminders')
        .insert({
          user_id: user.id,
          event_name: selectedEvent.name,
          event_date: eventDateStr,
          event_tradition: selectedEvent.tradition,
          event_type: selectedEvent.type,
          reminder_days_before: daysBefore
        });
    }

    const newReminders = new Map(reminders);
    newReminders.set(eventKey, daysBefore);
    localStorage.setItem('fastingReminders', JSON.stringify(Array.from(newReminders)));
    setReminders(newReminders);
    
    const daysText = daysBefore === 0 ? "on the day" : daysBefore === 1 ? "1 day before" : `${daysBefore} days before`;
    toast.success(`Reminder set ${daysText}! 🔔`);
    setShowReminderDialog(false);
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
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {displayMonthName} {selectedYear} Fasts, Feasts & Holidays
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
        </CardHeader>
        
        {/* Tradition + Calendar System Selectors */}
        <div className="flex flex-col gap-4 py-4 px-4 sm:flex-row sm:items-start sm:justify-between">
          <RadioGroup
            value={selectedTradition}
            onValueChange={(value) => setSelectedTradition(value as "Eastern Orthodox" | "Oriental Orthodox")}
            className="flex flex-col gap-2 items-start"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Eastern Orthodox" id="eastern" />
              <Label htmlFor="eastern" className="cursor-pointer whitespace-nowrap text-base sm:text-lg">
                ⛪ Eastern Orthodox
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Oriental Orthodox" id="oriental" />
              <Label htmlFor="oriental" className="cursor-pointer whitespace-nowrap text-base sm:text-lg">
                ⛪ Oriental Orthodox
              </Label>
            </div>
          </RadioGroup>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-muted-foreground">
              Calendar
            </Label>
            <RadioGroup
              value={calendarSystem}
              onValueChange={(value) => setCalendarSystem(value as CalendarSystem)}
              className="flex flex-col gap-2 items-start"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Gregorian" id="cal-gregorian" />
                <Label htmlFor="cal-gregorian" className="cursor-pointer whitespace-nowrap text-sm sm:text-base">
                  Gregorian Calendar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Julian" id="cal-julian" />
                <Label htmlFor="cal-julian" className="cursor-pointer whitespace-nowrap text-sm sm:text-base">
                  Julian Calendar
                </Label>
              </div>
            </RadioGroup>
            {calendarSystem === "Julian" && selectedTradition === "Oriental Orthodox" && (
              <p className="text-xs text-muted-foreground max-w-xs">
                Oriental Orthodox traditions use their own calendars (Coptic, Ethiopian, etc.); the Julian shift only applies to Eastern Orthodox fixed feasts.
              </p>
            )}
          </div>
        </div>
        <CardContent className="space-y-3 pt-4">
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
                      : event.type === "holiday"
                        ? isEastern
                          ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-700"
                          : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
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
                          : event.type === "holiday"
                            ? "text-amber-900 dark:text-amber-100"
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
                        {isEastern ? "⛪ Eastern Orthodox" : "⛪ Oriental Orthodox"}
                      </Badge>
                    </div>
                    {event.isMajor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleReminderClick(event)}
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
                      : event.type === "holiday"
                        ? "text-amber-800 dark:text-amber-200"
                        : "text-blue-800 dark:text-blue-200"
                  }`}>
                    {event.endDate ? `${event.startDate} - ${event.endDate}` : event.startDate}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No major fasts or feasts this month
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
          calendarSystem={calendarSystem}
        />
      )}

      {/* Reminder Preference Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reminder</DialogTitle>
            <DialogDescription>
              When would you like to be reminded about {selectedEvent?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={reminderDaysBefore} onValueChange={setReminderDaysBefore}>
              <SelectTrigger>
                <SelectValue placeholder="Choose reminder timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">On the day of the {selectedEvent?.type}</SelectItem>
                <SelectItem value="1">1 day before (daily reminders)</SelectItem>
                <SelectItem value="2">2 days before (daily reminders)</SelectItem>
                <SelectItem value="3">3 days before (daily reminders)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowReminderDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmReminder} className="flex-1">
                Set Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
