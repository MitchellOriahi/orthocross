import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { VERSE_IMAGE_DESIGNS } from "../_shared/verseImageDesigns.ts";

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

    const { verseText, verseReference, styleId = "golden" } = await req.json();
    if (!verseText || !verseReference) {
      return new Response(
        JSON.stringify({ error: "Missing verseText or verseReference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const design = VERSE_IMAGE_DESIGNS.find((item) => item.id === styleId);
    if (!design) {
      return new Response(JSON.stringify({ error: "Unknown image design" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    const model = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-3.1-flash-image";

    const prompt = `Create a stunning 4K square (1:1) background illustration whose imagery, mood, palette, and symbolism are derived SPECIFICALLY from this Bible verse: "${verseText}" — ${verseReference}.

Required artistic design for THIS image: ${design.prompt}
Follow this design's medium, lighting, scenery and palette; do not randomly substitute another style.

Interpretation rules:
- READ THE VERSE and choose scenery, weather, time of day, season, colors, and symbolic motifs that directly evoke its meaning. Different verses must produce visibly different images (a verse about light → dawn breaking; about waters → seas/rivers; about shepherds → green pastures; about refuge → mountains/strongholds; about harvest → wheat fields; about peace → still gardens; about fire → embers and warm glow; etc.).
- Reverent, contemplative, awe-inspiring atmosphere with Orthodox/Byzantine spiritual undertone.
- Keep the upper 55% visually rich and clearly show the selected design. Keep the lower 45% simple and low-detail for a separate verse text overlay.
- Acceptable elements: landscapes, seas, mountains, deserts, gardens, wheat, olive trees, doves, lanterns, ancient stone paths, distant cathedrals/monasteries, lone wanderer from behind, candles, open scrolls, vines, lambs, stars.
- STRICTLY FORBIDDEN: any depiction of Jesus, God, angels with faces, saints, or any human face. No religious figures with visible features — only distant silhouettes from behind or symbolic objects.
- STRICTLY FORBIDDEN: any text, letters, words, numerals, watermarks, signatures, calligraphy, or captions anywhere in the image.
- Square 1:1, ultra-detailed, 4K, masterpiece quality, gallery-worthy.`;


    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const inline = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData;
    const imageUrl = inline ? `data:${inline.mimeType};base64,${inline.data}` : undefined;

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
