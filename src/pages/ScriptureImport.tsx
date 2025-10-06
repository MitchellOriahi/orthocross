import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ScriptureImport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);

  const handleImportAll = async () => {
    setIsImporting(true);
    setProgress([]);

    try {
      setProgress(prev => [...prev, "🚀 Starting Orthodox scripture import..."]);
      
      const { data, error } = await supabase.functions.invoke('import-scripture', {
        body: { action: 'import_all_orthodox' }
      });

      if (error) throw error;

      if (data.success) {
        setProgress(prev => [...prev, `✅ Import complete! ${data.totalVerses} verses imported`]);
        toast({
          title: "Import Successful",
          description: `Imported ${data.totalVerses} verses from Orthodox books`,
        });
      } else {
        setProgress(prev => [...prev, "❌ Some books failed to import", ...data.errors]);
        toast({
          title: "Partial Import",
          description: "Some books encountered errors. Check the log for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setProgress(prev => [...prev, `❌ Import failed: ${error.message}`]);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
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
            <h1 className="text-2xl font-bold">Scripture Import</h1>
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
                Orthodox Scripture Collection
              </CardTitle>
              <CardDescription>
                Import all Orthodox Bible books including deuterocanon and Oriental Orthodox texts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Books to be imported:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground grid grid-cols-2 gap-2">
                  <li>Tobit</li>
                  <li>Judith</li>
                  <li>Wisdom of Solomon</li>
                  <li>Sirach (Ecclesiasticus)</li>
                  <li>Baruch</li>
                  <li>1-4 Maccabees</li>
                  <li>Prayer of Manasseh</li>
                  <li>Psalm 151</li>
                  <li>1 Esdras</li>
                  <li>Prayer of Azariah</li>
                  <li>Susanna</li>
                  <li>Bel and the Dragon</li>
                  <li>1 Enoch</li>
                  <li>Jubilees</li>
                  <li>4 Baruch</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription>
                  All texts are sourced from authenticated public domain translations.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleImportAll} 
                disabled={isImporting}
                className="w-full"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Import All Orthodox Books"}
              </Button>

              {progress.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Import Log</span>
                  </div>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div className="space-y-1">
                      {progress.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`text-xs font-mono ${
                            msg.startsWith('✅') ? 'text-green-600' : 
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Deuterocanon:</strong> Public domain translations from authenticated sources</p>
              <p><strong>Oriental Orthodox texts:</strong> R.H. Charles and CATSS translations (Public Domain)</p>
              <p><strong>Quality:</strong> All texts verified for authenticity and completeness</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
