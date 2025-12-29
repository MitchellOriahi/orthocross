import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Church } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FastingCalendarView } from "./FastingCalendarView";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllFastingEvents, formatEventDate } from "@/data/fastingEvents";

interface FastingEvent {
  name: string;
  startDate: string;
  endDate?: string;
  tradition: string;
  type: "fast" | "feast";
  isMajor: boolean;
}

export const FastingCalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<"Eastern Orthodox" | "Oriental Orthodox">("Eastern Orthodox");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getEventsForMonth = (month: number, year: number): FastingEvent[] => {
    const allEvents = getAllFastingEvents(year);
    
    const events = allEvents
      .filter(event => {
        const eventTradition = selectedTradition === "Eastern Orthodox" ? "Eastern" : "Oriental";
        if (event.tradition !== eventTradition) return false;
        if (!event.isMajor) return false;
        
        // Check if the event's start month matches
        const isInMonth = event.month === month + 1;
        
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
        // Sort by type (feasts first, then fasts)
        if (a.type !== b.type) {
          return a.type === "feast" ? -1 : 1;
        }
        return 0;
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

  const currentEvents = getEventsForMonth(selectedMonth, selectedYear);

  return (
    <div className="space-y-4">
      <Card className="shadow-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Fasting Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select 
                value={selectedTradition} 
                onValueChange={(value: "Eastern Orthodox" | "Oriental Orthodox") => setSelectedTradition(value)}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <Church className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eastern Orthodox">
                    <div className="flex items-center gap-2">
                      Eastern Orthodox
                    </div>
                  </SelectItem>
                  <SelectItem value="Oriental Orthodox">
                    <div className="flex items-center gap-2">
                      Oriental Orthodox
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Events List */}
          {currentEvents.length > 0 ? (
            currentEvents.map((event, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg mb-3 last:mb-0 ${
                  event.type === "fast" 
                    ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900" 
                    : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-semibold ${
                    event.type === "fast" 
                      ? "text-red-800 dark:text-red-200" 
                      : "text-blue-800 dark:text-blue-200"
                  }`}>
                    {event.name}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      event.type === "fast"
                        ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                        : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {event.type}
                  </Badge>
                </div>
                <p className={`text-sm font-medium ${
                  event.type === "fast" 
                    ? "text-red-800 dark:text-red-200" 
                    : "text-blue-800 dark:text-blue-200"
                }`}>
                  {event.endDate ? `${event.startDate} - ${event.endDate}` : event.startDate}
                </p>
              </div>
            ))
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
        />
      )}
    </div>
  );
};