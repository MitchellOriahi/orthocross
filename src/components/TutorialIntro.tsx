import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flame, Book, Hand, Move, Settings, Cross } from "lucide-react";

const slides = [
  {
    title: "Welcome to OrthoCross",
    description: "Let's take a quick tour of the app's features",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M6 8h12" />
      </svg>
    ),
    animation: "animate-fade-in"
  },
  {
    title: "Navigate with Ease",
    description: "Use the navigation bar at the bottom to quickly move between sections",
    icon: Move,
    animation: "animate-slide-in-right"
  },
  {
    title: "Background Music",
    description: "Enjoy calming ambient music while you read. You can turn it on/off anytime in Settings",
    icon: Settings,
    animation: "animate-fade-in"
  },
  {
    title: "Build Your Streak",
    description: "Read daily to keep your flame burning and track your spiritual journey",
    icon: Flame,
    animation: "animate-fade-in"
  },
  {
    title: "Ready to Begin",
    description: "Explore the app and start your Orthodox journey today",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M6 8h12" />
      </svg>
    ),
    animation: "animate-scale-in"
  }
];

export const TutorialIntro = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      // Show tutorial after a brief delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsOpen(false);
  };


  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          {/* Icon */}
          <div className={`w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center ${slide.animation}`}>
            <Icon className="w-12 h-12 text-primary" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">{slide.title}</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {slide.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center w-full gap-2">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="min-w-32"
            >
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};