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

    const prompt = `Create a stunning 4K anime/Studio Ghibli-inspired illustration as a square (1:1) background image whose mood and scenery thematically match this Bible verse: "${verseText}" — ${verseReference}.

Visual direction:
- Cinematic anime key-visual quality, Makoto Shinkai / Studio Ghibli style — painterly clouds, volumetric light, lush detailed backgrounds, soft god-rays, glowing horizon
- Reverent, peaceful, awe-inspiring atmosphere; sacred and contemplative
- Compose with the TOP-CENTER area kept relatively calm and softly darkened so overlay text will be readable (sky, soft clouds, gentle gradient, no busy detail in the upper 60%)
- Bottom of the image can feature beautiful detailed scenery thematically tied to the verse (mountains, sea, wheat fields, gardens, ancient stone paths, distant cathedral silhouettes, a lone wanderer with back turned, doves, olive trees, etc. — pick what fits the verse)
- Warm gold + deep navy palette with soft ivory highlights; subtle Orthodox/Byzantine feel
- IMPORTANT: Do NOT depict Jesus, God, saints, or any human faces. Show only scenery, symbolism, distant silhouettes from behind, or natural elements. No religious figures.
- IMPORTANT: Do NOT include any text, letters, words, watermarks, signatures, or captions anywhere in the image.
- Square aspect ratio 1:1, ultra-detailed, 4K, masterpiece quality`;

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
