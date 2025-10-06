import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Download, BookOpen, Upload } from "lucide-react";
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

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setProgress([`📦 Uploading and processing ${file.name}...`]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-zip-upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      if (data.success) {
        setProgress(prev => [
          ...prev,
          `✅ Successfully imported ${data.totalVerses} verses`,
          `📚 Processed books: ${data.processedBooks.join(', ')}`
        ]);
        toast({
          title: "Import Successful",
          description: `Imported ${data.totalVerses} verses from ${data.processedBooks.length} books!`,
        });
      } else {
        setProgress(prev => [
          ...prev,
          `⚠️ Partial success: ${data.totalVerses} verses imported`,
          ...data.errors.map((e: string) => `❌ ${e}`)
        ]);
        toast({
          title: "Partial Import",
          description: "Some books failed to import. Check the log.",
          variant: "destructive"
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setProgress(prev => [...prev, `❌ Upload failed: ${message}`]);
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      e.target.value = '';
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
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleZipUpload}
                    disabled={isImporting}
                    className="hidden"
                    id="zip-upload"
                  />
                  <label htmlFor="zip-upload" className="cursor-pointer">
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {isImporting ? 'Processing...' : 'Upload ZIP Bundle'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click to select Orthodox scripture bundle (ZIP format)
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or use API (placeholder)
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleImportAll} 
                  disabled={isImporting}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isImporting ? "Importing..." : "Import from API"}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  Upload a ZIP file containing JSON files with Orthodox scripture texts.
                </AlertDescription>
              </Alert>

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
