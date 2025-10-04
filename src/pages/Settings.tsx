import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useMusic } from "@/contexts/MusicContext";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

const Settings = () => {
  const navigate = useNavigate();
  const { isPlaying, toggleMusic, volume, setVolume } = useMusic();

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center p-1">
                  <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Music Settings */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Background Music
              </CardTitle>
              <CardDescription>
                Enhance your spiritual practice with peaceful ambient music
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Music Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable Music</p>
                  <p className="text-sm text-muted-foreground">
                    Play relaxing background music while using the app
                  </p>
                </div>
                <Switch
                  checked={isPlaying}
                  onCheckedChange={toggleMusic}
                />
              </div>

              {/* Volume Control */}
              {isPlaying && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Volume
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(values) => setVolume(values[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* App Information */}
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>About OrthoCross App</CardTitle>
              <CardDescription>
                Version 1.0.0
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build your daily spiritual practice with Bible reading streaks, 
                fasting reminders, and Orthodox learning.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
