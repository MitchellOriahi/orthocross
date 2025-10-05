import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Book, Flame, Calendar, Scroll, ChevronLeft, ChevronRight } from "lucide-react";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";

const Home = () => {
  const navigate = useNavigate();
  const [hasClicked, setHasClicked] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const isMobile = useIsMobile();

  useEffect(() => {
    const clicked = localStorage.getItem("hasClickedBegin");
    if (clicked === "true") {
      setHasClicked(true);
    }
  }, []);

  // Auto-play carousel - slower on mobile/tablet
  useEffect(() => {
    if (!carouselApi) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, isMobile ? 5000 : 3000); // 5s on mobile/tablet, 3s on desktop

    return () => clearInterval(interval);
  }, [carouselApi, isMobile]);

  const handleBeginClick = () => {
    setHasClicked(true);
    localStorage.setItem("hasClickedBegin", "true");
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 text-center space-y-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-foreground dark:bg-background rounded-2xl shadow-sacred mb-4 p-2">
            <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to the <span className="text-foreground">OrthoCross App</span>
          </h1>
          
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Build your daily spiritual practice with Bible reading streaks, fasting reminders, and Orthodox learning, engaging and meaningful, every day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12">
            <Button 
              variant="sacred" 
              size="lg"
              onClick={handleBeginClick}
              className="text-2xl px-16 py-8 h-auto"
            >
              {hasClicked ? "Continue Your Journey" : "Begin Your Journey"}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 pt-12 pb-12">
        <div className="relative max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
            setApi={setCarouselApi}
          >
            <CarouselContent className="-ml-4">
              {/* Feature 1 */}
              <CarouselItem className="pl-4 md:basis-1/3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth text-left w-full h-full"
                >
                  <div className="w-12 h-12 bg-foreground dark:bg-background rounded-lg flex items-center justify-center p-1.5">
                    <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold">Reading Streaks</h3>
                  <p className="text-muted-foreground">
                    Build consistency with daily Bible reading. Track your progress and maintain 
                    your flame with engaging streak mechanics.
                  </p>
                </button>
              </CarouselItem>

              {/* Feature 2 */}
              <CarouselItem className="pl-4 md:basis-1/3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth text-left w-full h-full"
                >
                  <div className="w-12 h-12 bg-foreground dark:bg-background rounded-lg flex items-center justify-center p-1.5">
                    <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold">Fasting Calendar</h3>
                  <p className="text-muted-foreground">
                    Stay connected to Orthodox fasting periods with reminders for both Eastern 
                    and Oriental traditions.
                  </p>
                </button>
              </CarouselItem>

              {/* Feature 3 */}
              <CarouselItem className="pl-4 md:basis-1/3">
                <button 
                  onClick={() => navigate('/church-resources')}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth text-left w-full h-full"
                >
                  <div className="w-12 h-12 bg-foreground dark:bg-background rounded-lg flex items-center justify-center p-1.5">
                    <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold">Church Resources</h3>
                  <p className="text-muted-foreground">
                    Access church etiquette guides for both Eastern and Oriental Orthodox 
                    traditions, and learn proper conduct.
                  </p>
                </button>
              </CarouselItem>

              {/* Feature 4 */}
              <CarouselItem className="pl-4 md:basis-1/3">
                <button 
                  onClick={() => navigate('/orthodox-history')}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth text-left w-full h-full"
                >
                  <div className="w-12 h-12 bg-foreground dark:bg-background rounded-lg flex items-center justify-center p-1.5">
                    <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold">Orthodox History</h3>
                  <p className="text-muted-foreground">
                    Explore the rich history of the Orthodox Church through interactive timelines 
                    and engaging stories.
                  </p>
                </button>
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4"
            onClick={() => carouselApi?.scrollPrev()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4"
            onClick={() => carouselApi?.scrollNext()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 OrthoCross App. Building faith through daily practice.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
