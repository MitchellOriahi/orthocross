import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Flame, Book, Hand, Move } from "lucide-react";

const slides = [
  {
    title: "Welcome to OrthoCross",
    description: "Let's take a quick tour of the app's features",
    icon: Book,
    animation: "animate-fade-in"
  },
  {
    title: "Swipe to Navigate",
    description: "On mobile, swipe left or right to move between Orthodox History, Scripture, Dashboard, and Resources",
    icon: Move,
    animation: "animate-slide-in-right"
  },
  {
    title: "Tap to Flip Pages",
    description: "Tap the left side to go back, right side to go forward when reading Scripture, prayers, or history",
    icon: Hand,
    animation: "animate-scale-in"
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
    icon: Book,
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

  const handleSkip = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsOpen(false);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
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
          <div className="flex items-center justify-between w-full gap-4">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            
            <div className="flex gap-2">
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
                className="min-w-24"
              >
                {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};