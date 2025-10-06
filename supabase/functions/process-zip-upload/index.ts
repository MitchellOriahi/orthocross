import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const formData = await req.formData();
    const zipFile = formData.get('file') as File;
    
    if (!zipFile) {
      throw new Error('No file provided');
    }

    console.log(`Processing ZIP file: ${zipFile.name}, size: ${zipFile.size}`);

    // Read the ZIP file
    const zipBytes = new Uint8Array(await zipFile.arrayBuffer());
    
    // Extract files from ZIP
    const tempDir = await Deno.makeTempDir();
    const zipPath = `${tempDir}/upload.zip`;
    await Deno.writeFile(zipPath, zipBytes);
    
    const extractedPath = `${tempDir}/extracted`;
    await Deno.mkdir(extractedPath, { recursive: true });
    await decompress(zipPath, extractedPath);

    // Process extracted files
    let totalVerses = 0;
    const processedBooks: string[] = [];
    const errors: string[] = [];

    // Walk through extracted directory
    for await (const entry of Deno.readDir(extractedPath)) {
      if (entry.isFile && entry.name.endsWith('.json')) {
        try {
          const filePath = `${extractedPath}/${entry.name}`;
          const content = await Deno.readTextFile(filePath);
          const data = JSON.parse(content);
          
          console.log(`Processing ${entry.name}:`, JSON.stringify(data).substring(0, 200));

          // Handle different JSON structures
          if (data.book && data.chapters) {
            // Structure: { book: "name", chapters: [{ chapter: 1, verses: [...] }] }
            for (const chapterData of data.chapters) {
              const verses = chapterData.verses.map((v: any) => ({
                book: data.book,
                chapter: chapterData.chapter,
                verse_number: v.verse || v.number || v.n,
                verse_text: v.text
              }));

              const { error } = await supabaseClient
                .from('bible_verses')
                .upsert(verses, { onConflict: 'book,chapter,verse_number' });

              if (error) throw error;
              totalVerses += verses.length;
            }
            processedBooks.push(data.book);
          } else if (Array.isArray(data)) {
            // Structure: [{ book, chapter, verse_number, verse_text }]
            const { error } = await supabaseClient
              .from('bible_verses')
              .upsert(data, { onConflict: 'book,chapter,verse_number' });

            if (error) throw error;
            totalVerses += data.length;
            processedBooks.push(entry.name.replace('.json', ''));
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push(`${entry.name}: ${errorMessage}`);
          console.error(`Error processing ${entry.name}:`, errorMessage);
        }
      }
    }

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        totalVerses,
        processedBooks,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
