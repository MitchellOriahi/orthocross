import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Book, Flame, Calendar, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center space-y-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 gradient-sacred rounded-2xl shadow-sacred mb-4">
            <Book className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="gradient-sacred bg-clip-text text-transparent">OrthoLingo</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build your daily spiritual practice with Bible reading streaks, fasting reminders, 
            and Orthodox learning—engaging and meaningful, every day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="sacred" 
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="text-lg px-8"
            >
              Begin Your Journey
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth">
            <div className="w-12 h-12 gradient-sacred rounded-lg flex items-center justify-center">
              <Flame className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Reading Streaks</h3>
            <p className="text-muted-foreground">
              Build consistency with daily Bible reading. Track your progress and maintain 
              your flame with engaging streak mechanics.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth">
            <div className="w-12 h-12 gradient-sacred rounded-lg flex items-center justify-center">
              <Calendar className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Fasting Calendar</h3>
            <p className="text-muted-foreground">
              Stay connected to Orthodox fasting periods with reminders for both Eastern 
              and Oriental traditions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-8 space-y-4 shadow-elevated hover:shadow-sacred transition-smooth">
            <div className="w-12 h-12 gradient-sacred rounded-lg flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Study Resources</h3>
            <p className="text-muted-foreground">
              Access the Orthodox Study Bible, church etiquette lessons, and additional 
              canonical readings.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center space-y-6 shadow-elevated">
          <h2 className="text-3xl md:text-4xl font-bold">
            Start Your Spiritual Journey Today
          </h2>
          <p className="text-lg text-muted-foreground">
            Join Orthodox Christians worldwide in building meaningful daily habits 
            rooted in faith and tradition.
          </p>
          <Button 
            variant="sacred" 
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="text-lg px-8"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 OrthoLingo. Building faith through daily practice.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
