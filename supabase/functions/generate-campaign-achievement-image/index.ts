import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    const title = campaignType === "eastern" 
      ? "Full Eastern Armor of God Assembled!" 
      : "Full Oriental Armor of God Assembled!";
    
    const churchType = campaignType === "eastern" ? "Eastern Orthodox" : "Oriental Orthodox";

    const prompt = `Create a celebratory achievement image with the following specifications:
    - Square format (1024x1024)
    - Modern, minimalist design with a spiritual/religious aesthetic
    - Warm, peaceful color palette with gold/amber accents
    - Center the text: "${title}"
    - Below that, add: "Completed all ${churchType} History Islands"
    - Include a stylized shield or armor icon at the top
    - Add subtle Orthodox cross patterns in the background
    - Include decorative rays or glow effect
    - Professional typography with good contrast
    - Bottom corner: small "Orthodox Daily" branding
    - Overall feel: accomplishment, spiritual growth, ancient wisdom meets modern design
    - NO people or faces, focus on symbols and typography`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
