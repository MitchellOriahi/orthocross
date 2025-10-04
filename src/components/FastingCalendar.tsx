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
    name: "Apostles' Fast",
    startDate: "June 15",
    endDate: "June 28",
    tradition: "Eastern Orthodox"
  }
];

export const FastingCalendar = () => {
  return (
    <Card className="shadow-elevated border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Fasts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingFasts.map((fast, index) => (
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
        ))}
      </CardContent>
    </Card>
  );
};
