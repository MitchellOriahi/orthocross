import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importFromJSON, importFromCSV } from "@/utils/scriptureImporter";
import { allExtraBooks } from "@/data/scriptureConfig";
import { ArrowLeft, Upload, Book, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminImport() {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleJSONImport = async () => {
    try {
      setLoading(true);
      setResult(null);
      const payload = JSON.parse(jsonInput);
      const importResult = await importFromJSON(payload);
      setResult(importResult);
      
      if (importResult.success) {
        toast.success(`Imported ${importResult.totalVerses} verses from ${importResult.totalChapters} chapters`);
      } else {
        toast.error("Import completed with errors");
      }
    } catch (err: any) {
      setResult({ success: false, errors: [err.message] });
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async () => {
    try {
      setLoading(true);
      setResult(null);
      const importResult = await importFromCSV(csvInput);
      setResult(importResult);
      
      if (importResult.success) {
        toast.success(`Imported ${importResult.totalVerses} verses`);
      } else {
        toast.error("Import failed");
      }
    } catch (err: any) {
      setResult({ success: false, errors: [err.message] });
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  const jsonTemplate = {
    book: { slug: "1enoch", name: "1 Enoch" },
    source_code: "RH_CHARLES",
    language: "en",
    chapters: [
      {
        number: 1,
        verses: [
          { n: 1, text: "The words of the blessing..." },
          { n: 2, text: "And Enoch took up his parable..." }
        ]
      }
    ]
  };

  const csvTemplate = `book_slug,book_name,source_code,language,chapter,verse,text
1enoch,1 Enoch,RH_CHARLES,en,1,1,The words of the blessing...
1enoch,1 Enoch,RH_CHARLES,en,1,2,And Enoch took up his parable...`;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Scripture Import Tool</h1>
            <p className="text-muted-foreground">Import Orthodox extra-canonical books</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Available Books to Import
            </CardTitle>
            <CardDescription>
              These books need content imported via JSON or CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {allExtraBooks.map(book => (
                <div key={book.slug} className="p-2 bg-muted rounded">
                  {book.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="json" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="json">JSON Import</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>JSON Format</CardTitle>
                <CardDescription>Paste your JSON payload below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded text-xs overflow-auto">
                  <pre>{JSON.stringify(jsonTemplate, null, 2)}</pre>
                </div>
                
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste JSON here..."
                  className="min-h-[300px] font-mono text-sm"
                />
                
                <Button 
                  onClick={handleJSONImport} 
                  disabled={loading || !jsonInput}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? "Importing..." : "Import JSON"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CSV Format</CardTitle>
                <CardDescription>Paste your CSV data below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded text-xs overflow-auto">
                  <pre>{csvTemplate}</pre>
                </div>
                
                <Textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder="Paste CSV here..."
                  className="min-h-[300px] font-mono text-sm"
                />
                
                <Button 
                  onClick={handleCSVImport} 
                  disabled={loading || !csvInput}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {loading ? "Importing..." : "Import CSV"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.success ? (
                <div>
                  <p className="font-semibold">Import Successful!</p>
                  <p>Imported {result.totalVerses} verses</p>
                  {result.totalChapters && <p>from {result.totalChapters} chapters</p>}
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Import Failed</p>
                  {result.errors?.map((err: string, i: number) => (
                    <p key={i} className="text-sm">{err}</p>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
