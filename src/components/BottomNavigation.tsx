import { useNavigate, useLocation } from "react-router-dom";
import { Flame, Book, Church, ScrollText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: ScrollText,
      path: "/orthodox-history",
      label: "History"
    },
    {
      icon: Book,
      path: "/index",
      label: "Scripture"
    },
    {
      icon: Flame,
      path: "/dashboard",
      label: "Board"
    },
    {
      icon: Church,
      path: "/church-resources",
      label: "Church"
    },
    {
      icon: Users,
      path: "/friends",
      label: "Friends"
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};