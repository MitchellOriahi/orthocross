import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { verseText, verseReference } = await req.json();
    if (!verseText || !verseReference) {
      return new Response(
        JSON.stringify({ error: "Missing verseText or verseReference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Vary the artistic style based on the verse so each share feels unique
    const styles = [
      "cinematic Makoto Shinkai anime key-visual — hyper-detailed painterly skies, volumetric god-rays, glowing horizon, lens flare",
      "Studio Ghibli watercolor landscape — soft pastel washes, hand-painted clouds, gentle wind through grass, nostalgic warmth",
      "ukiyo-e woodblock print reinterpreted with anime sensibility — bold flat color planes, stylized waves and clouds, gold leaf accents",
      "moody anime oil-painting style — deep chiaroscuro, candle-warm highlights, baroque atmosphere, Caravaggio-inspired light",
      "ethereal celestial anime art — nebulae, starfields, aurora, drifting petals or embers, dreamlike scale",
      "serene Eastern Orthodox iconographic landscape reimagined as anime — gold-leaf sky, Byzantine ornament patterns subtly woven into clouds, deep jewel tones",
      "minimalist anime ink-wash (sumi-e) with a single bold accent color — vast negative space, restrained brushwork, meditative silence",
    ];
    // Deterministic-ish pick from verse reference so the same verse trends toward similar style, but with variety across verses
    const styleIndex = Math.abs([...verseReference].reduce((a, c) => a + c.charCodeAt(0), 0)) % styles.length;
    const chosenStyle = styles[(styleIndex + Math.floor(Math.random() * 3)) % styles.length];

    const prompt = `Create a stunning 4K square (1:1) background illustration whose imagery, mood, palette, and symbolism are derived SPECIFICALLY from this Bible verse: "${verseText}" — ${verseReference}.

Artistic style for THIS image: ${chosenStyle}.

Interpretation rules:
- READ THE VERSE and choose scenery, weather, time of day, season, colors, and symbolic motifs that directly evoke its meaning. Different verses must produce visibly different images (a verse about light → dawn breaking; about waters → seas/rivers; about shepherds → green pastures; about refuge → mountains/strongholds; about harvest → wheat fields; about peace → still gardens; about fire → embers and warm glow; etc.).
- Reverent, contemplative, awe-inspiring atmosphere with Orthodox/Byzantine spiritual undertone.
- Compose so the UPPER-CENTER region is calmer and slightly darker (sky, soft gradient, gentle clouds, mist) to allow overlay text to remain readable. Place the richest detail in the lower two-thirds.
- Acceptable elements: landscapes, seas, mountains, deserts, gardens, wheat, olive trees, doves, lanterns, ancient stone paths, distant cathedrals/monasteries, lone wanderer from behind, candles, open scrolls, vines, lambs, stars.
- STRICTLY FORBIDDEN: any depiction of Jesus, God, angels with faces, saints, or any human face. No religious figures with visible features — only distant silhouettes from behind or symbolic objects.
- STRICTLY FORBIDDEN: any text, letters, words, numerals, watermarks, signatures, calligraphy, or captions anywhere in the image.
- Square 1:1, ultra-detailed, 4K, masterpiece quality, gallery-worthy.`;


    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated from AI");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error generating verse image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
