import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FastingPeriod {
  name: string;
  startDate: string;
  endDate: string;
  tradition: string;
}

const upcomingFasts: FastingPeriod[] = [
  {
    name: "Nativity Fast",
    startDate: "November 15",
    endDate: "December 24",
    tradition: "Eastern Orthodox"
  },
  {
    name: "Nativity Fast",
    startDate: "November 25",
    endDate: "January 6",
    tradition: "Oriental Orthodox"
  },
  {
    name: "Great Lent",
    startDate: "February 10",
    endDate: "April 5",
    tradition: "Oriental Orthodox"
  },
  {
    name: "Nineveh Fast",
    startDate: "February 3",
    endDate: "February 5",
    tradition: "Oriental Orthodox"
  },
  {
    name: "Apostles' Fast",
    startDate: "June 15",
    endDate: "June 28",
    tradition: "Eastern Orthodox"
  },
  {
    name: "Apostles' Fast",
    startDate: "June 16",
    endDate: "July 11",
    tradition: "Oriental Orthodox"
  },
  {
    name: "Dormition Fast",
    startDate: "August 7",
    endDate: "August 21",
    tradition: "Oriental Orthodox"
  }
];

export const FastingCalendar = () => {
  const getCurrentMonthFasts = () => {
    const currentMonth = new Date().getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return upcomingFasts.filter(fast => {
      const fastMonths = [fast.startDate, fast.endDate].map(date => {
        const month = date.split(' ')[0];
        return monthNames.indexOf(month);
      });
      
      return fastMonths.some(month => month === currentMonth);
    });
  };

  const currentMonthFasts = getCurrentMonthFasts();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <Card className="shadow-elevated border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {currentMonthName} Fasts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentMonthFasts.length > 0 ? (
          currentMonthFasts.map((fast, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg bg-secondary/50 border border-border/50 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground">{fast.name}</h4>
              <Badge variant="outline" className="text-xs">
                {fast.tradition}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {fast.startDate} - {fast.endDate}
            </p>
          </div>
        ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No fasts this month
          </p>
        )}
      </CardContent>
    </Card>
  );
};
