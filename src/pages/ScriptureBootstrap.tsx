import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { runFullBootstrap } from "@/utils/scripture-bootstrap";

export default function ScriptureBootstrap() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);

  const handleRunBootstrap = async () => {
    setIsRunning(true);
    setProgress([]);
    setComplete(false);

    const result = await runFullBootstrap((msg) => {
      setProgress(prev => [...prev, msg]);
    });

    setComplete(true);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Scripture Bootstrap</h1>
            <p className="text-sm text-muted-foreground">Import complete Orthodox canon from public domain sources</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Full Scripture Import
              </CardTitle>
              <CardDescription>
                This will import all Orthodox Bible books including deuterocanon and Oriental Orthodox extras from authenticated public domain sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">What will be imported:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Old Testament + Deuterocanon via LXX2012 (Brenton PD)</li>
                  <li>Tobit, Judith, Wisdom, Sirach, Baruch, Letter of Jeremiah</li>
                  <li>Prayer of Azariah, Susanna, Bel and the Dragon</li>
                  <li>1 Esdras, Prayer of Manasseh, Psalm 151</li>
                  <li>1-4 Maccabees</li>
                  <li>1 Enoch (R.H. Charles PD translation)</li>
                  <li>Jubilees (R.H. Charles PD translation)</li>
                  <li>4 Baruch (CATSS PD translation)</li>
                  <li>Meqabyan 1 (partial PD available)</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  This process may take several minutes. All texts are from authenticated public domain sources.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleRunBootstrap} 
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isRunning ? "Importing..." : "Start Import"}
              </Button>

              {progress.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Import Progress</span>
                    {isRunning && <span className="text-sm text-muted-foreground">Running...</span>}
                    {complete && <span className="text-sm text-green-600">Complete!</span>}
                  </div>
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-1">
                      {progress.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`text-xs font-mono ${
                            msg.startsWith('✓') ? 'text-green-600' : 
                            msg.startsWith('❌') ? 'text-red-600' : 
                            'text-muted-foreground'
                          }`}
                        >
                          {msg}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {complete && (
                <Alert>
                  <AlertDescription>
                    Import complete! All available Orthodox and Oriental Orthodox texts have been loaded. You can now read them in the Scripture section.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sources & Authenticity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>LXX2012:</strong> Brenton's English Septuagint (Public Domain) via eBible.org</p>
              <p><strong>1 Enoch & Jubilees:</strong> R.H. Charles translations (1906, Public Domain)</p>
              <p><strong>4 Baruch:</strong> CATSS translation by Robert Kraft (Public Domain)</p>
              <p><strong>Meqabyan:</strong> Partial chapters from Wikisource (Public Domain translations)</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
