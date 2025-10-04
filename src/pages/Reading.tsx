import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Type, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

const Reading = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(15);
  const [fontSize, setFontSize] = useState([16]);

  const sampleText = `In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through Him, and without Him nothing was made that was made. In Him was life, and the life was the light of men. And the light shines in the darkness, and the darkness did not comprehend it.

There was a man sent from God, whose name was John. This man came for a witness, to bear witness of the Light, that all through him might believe. He was not that Light, but was sent to bear witness of that Light. That was the true Light which gives light to every man coming into the world.

He was in the world, and the world was made through Him, and the world did not know Him. He came to His own, and His own did not receive Him. But as many as received Him, to them He gave the right to become children of God, to those who believe in His name: who were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.

And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth.`;

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Reading Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Gospel of John</h1>
                <p className="text-sm text-muted-foreground">Chapter 1:1-14</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bookmark className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-1" />
          </div>
        </div>
      </header>

      {/* Reading Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-8 shadow-elevated">
          <article 
            className="prose prose-lg max-w-none leading-relaxed text-foreground"
            style={{ fontSize: `${fontSize}px` }}
          >
            {sampleText.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6 first:mt-0">
                {paragraph}
              </p>
            ))}
          </article>
        </Card>

        {/* Reading Controls */}
        <div className="mt-8 flex flex-col gap-6">
          <Card className="p-6 shadow-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Size
                </label>
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
          </Card>

          <Button 
            variant="sacred" 
            size="lg" 
            className="w-full"
            onClick={() => {
              setProgress(Math.min(100, progress + 15));
              if (progress >= 85) navigate('/dashboard');
            }}
          >
            {progress >= 85 ? 'Complete Reading' : 'Continue'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Reading;
