import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Read-aloud speech for scripture. Two soothing voices only.
const VOICES: Record<string, string> = {
  male: "Charon",
  female: "Kore",
};
const MODEL = Deno.env.get("GEMINI_TTS_MODEL") || "gemini-2.5-flash-preview-tts";
const MAX_CHARS = 1200;

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Gemini returns raw 16-bit little-endian PCM; wrap it so the browser can play it.
function pcmToWav(pcm: Uint8Array, rate: number, channels = 1): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const w = new DataView(out.buffer);
  const put = (p: number, s: string) => { for (let i = 0; i < 4; i++) w.setUint8(p + i, s.charCodeAt(i)); };
  const frameBytes = 2 * channels;
  put(0, "RIFF"); w.setUint32(4, 36 + pcm.length, true); put(8, "WAVE");
  put(12, "fmt "); w.setUint32(16, 16, true); w.setUint16(20, 1, true);
  w.setUint16(22, channels, true); w.setUint32(24, rate, true);
  w.setUint32(28, rate * frameBytes, true); w.setUint16(32, frameBytes, true); w.setUint16(34, 16, true);
  put(36, "data"); w.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const token = authHeader.slice("Bearer ".length);
    // Local token check (no extra round-trip) so the voice starts sooner.
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, voice } = await req.json();
    if (typeof text !== "string" || !text.trim() || text.length > MAX_CHARS) {
      return new Response(JSON.stringify({ error: "Invalid text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const voiceName = VOICES[String(voice)] ?? VOICES.female;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Speech service is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `Read this scripture passage in a calm, warm, soothing voice, at an unhurried pace: ${text}` }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error(`Speech request failed [${upstream.status}]: ${body}`);
      return new Response(
        JSON.stringify({ error: "Speech request failed", status: upstream.status, details: body }),
        { status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await upstream.json();
    const inline = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)?.inlineData;
    if (!inline) {
      const reason = data.promptFeedback?.blockReason ?? data.candidates?.[0]?.finishReason ?? "no audio";
      console.error(`Speech request returned no audio: ${reason}`);
      return new Response(JSON.stringify({ error: "Speech request failed", details: String(reason) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = String(inline.mimeType ?? "").toLowerCase();
    const bytes = base64ToBytes(inline.data);
    const audio = mimeType.includes("wav")
      ? bytes
      : pcmToWav(bytes, Number(/rate=(\d+)/.exec(mimeType)?.[1]) || 24000, Number(/channels=(\d+)/.exec(mimeType)?.[1]) || 1);
    return new Response(audio.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("read-aloud error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
