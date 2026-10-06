import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { VERSE_IMAGE_DESIGNS } from "../_shared/verseImageDesigns.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const token = authHeader.slice("Bearer ".length);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { verseText, verseReference, styleId = "golden" } = await req.json();
    if (typeof verseText !== "string" || !verseText.trim() || verseText.length > 5000 ||
        typeof verseReference !== "string" || !verseReference.trim() || verseReference.length > 200 ||
        typeof styleId !== "string") {
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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("Image generation is not configured. Please contact support.");
    }

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
      "https://ai.gateway.lovable.dev/v1/images/generations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "openai/gpt-image-2.5-sunburst",
          prompt,
          size: "1024x1024",
          quality: "medium",
        }),
      }
    );

    if (!aiResponse.ok) {
      const details = await aiResponse.json().catch(() => null);
      const message = details?.message ?? details?.error?.message ?? `Image generation failed (${aiResponse.status}).`;
      return new Response(JSON.stringify({ error: message }), {
        status: aiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const encodedImage = aiData.data?.[0]?.b64_json;
    const imageUrl = encodedImage ? `data:image/png;base64,${encodedImage}` : undefined;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: aiData.error?.message ?? aiData.message ?? "No image was returned by the image service." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
