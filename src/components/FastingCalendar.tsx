import { useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { orientationForBranch, useOrthodoxOrientation } from "@/lib/orthodoxOrientation";
import { calendarTraditionForOrientation, readCalendarTradition, saveCalendarTradition, type CalendarTradition } from "@/lib/calendarTradition";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FastingCalendarView } from "./FastingCalendarView";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  const { user } = useAuth();
  const orientation = useOrthodoxOrientation();
  const { data: identity, isSuccess: identityLoaded } = useQuery({
    queryKey: ["profileIdentityTags", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profile_identity_tags")
        .select("branch, patron_saint_id, country_code, age").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000,
  });
  const defaultOrientation = user && identityLoaded ? orientationForBranch(identity?.branch) : orientation;
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<CalendarTradition>(() =>
    calendarTraditionForOrientation(defaultOrientation, readCalendarTradition(user?.id)));
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>("Gregorian");

  // Only a change in family/account applies a default; month/language changes never overwrite a manual pick.
  useLayoutEffect(() => {
    const next = calendarTraditionForOrientation(defaultOrientation, readCalendarTradition(user?.id));
    setSelectedTradition(next);
    saveCalendarTradition(user?.id, next);
  }, [user?.id, defaultOrientation]);

  const chooseCalendarTradition = (value: string) => {
    if (value !== "Eastern Orthodox" && value !== "Oriental Orthodox") return;
    setSelectedTradition(value);
    saveCalendarTradition(user?.id, value);
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
      <Card className="min-w-0 shadow-elevated border-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Calendar className="w-5 h-5 shrink-0 text-primary" />
              <span className="min-w-0 break-words">{displayMonthName} {selectedYear} Fasts, Feasts & Holidays</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Previous month" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Next month" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {/* Tradition + Calendar System Selectors */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] items-start gap-4 p-6">
          <RadioGroup
            value={selectedTradition}
            onValueChange={chooseCalendarTradition}
            className="flex min-w-0 flex-col gap-3 items-start"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Eastern Orthodox" id="eastern" className="shrink-0" />
              <Label htmlFor="eastern" className="cursor-pointer text-base leading-snug sm:text-lg">
                ⛪ Eastern Orthodox
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Oriental Orthodox" id="oriental" className="shrink-0" />
              <Label htmlFor="oriental" className="cursor-pointer text-base leading-snug sm:text-lg">
                ⛪ Oriental Orthodox
              </Label>
            </div>
          </RadioGroup>

          <div className="flex min-w-0 flex-col gap-3">
            <Label className="text-sm font-semibold text-muted-foreground">
              Calendar
            </Label>
            <RadioGroup
              value={calendarSystem}
              onValueChange={(value) => setCalendarSystem(value as CalendarSystem)}
              className="flex flex-col gap-2 items-start"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Gregorian" id="cal-gregorian" className="shrink-0" />
                <Label htmlFor="cal-gregorian" className="cursor-pointer text-sm leading-snug sm:text-base">
                  Gregorian Calendar
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Julian" id="cal-julian" className="shrink-0" />
                <Label htmlFor="cal-julian" className="cursor-pointer text-sm leading-snug sm:text-base">
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
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          calendarSystem={calendarSystem}
        />
      )}

    </div>
  );
};
