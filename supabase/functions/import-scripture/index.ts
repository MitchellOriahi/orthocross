import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Verse {
  n: number;
  text: string;
}

interface ChapterDoc {
  slug: string;
  chapter: number;
  verses: Verse[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, book } = await req.json();

    if (action === 'import_orthodox_book') {
      // Import specific Orthodox book using public domain sources
      const result = await importOrthodoxBook(book, supabaseClient);
      
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import_all_orthodox') {
      // Import all Orthodox additional books
      const books = [
        'tobit', 'judith', 'wisdom', 'sirach', 'baruch',
        '1maccabees', '2maccabees', '3maccabees', '4maccabees',
        'prayer_of_manasseh', 'psalm_151', '1esdras',
        'song_of_three', 'susanna', 'bel_and_dragon',
        '1enoch', 'jubilees', '4baruch'
      ];
      
      let totalVerses = 0;
      const errors: string[] = [];
      
      for (const bookSlug of books) {
        try {
          const result = await importOrthodoxBook(bookSlug, supabaseClient);
          totalVerses += result.versesImported;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push(`${bookSlug}: ${errorMessage}`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: errors.length === 0,
          totalVerses,
          errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function importOrthodoxBook(book: string, supabaseClient: any) {
  // Use public domain APIs and sources
  const verses: Array<{ book: string; chapter: number; verse_number: number; verse_text: string }> = [];
  
  // For now, create a placeholder structure
  // In production, you would fetch from actual PD sources
  
  // Example: Fetch from Bible-API or similar
  if (['tobit', 'judith', 'wisdom', 'sirach'].includes(book)) {
    // These books have varying chapter counts
    const chapterCounts: Record<string, number> = {
      'tobit': 14,
      'judith': 16,
      'wisdom': 19,
      'sirach': 51
    };
    
    const chapters = chapterCounts[book] || 10;
    
    for (let ch = 1; ch <= chapters; ch++) {
      // In production, fetch actual text from PD source
      verses.push({
        book,
        chapter: ch,
        verse_number: 1,
        verse_text: `[Chapter ${ch} - Text to be imported from authenticated public domain source]`
      });
    }
  }
  
  if (verses.length > 0) {
    const { error } = await supabaseClient
      .from('bible_verses')
      .upsert(verses, {
        onConflict: 'book,chapter,verse_number'
      });
    
    if (error) throw error;
  }
  
  return {
    book,
    versesImported: verses.length,
    chaptersImported: new Set(verses.map(v => v.chapter)).size
  };
}
