import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CANCELLATION-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the user's display name from profiles
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .single();

    const userName = profile?.display_name || profile?.username || "Friend in Christ";
    logStep("Got user profile", { userName });

    const emailResponse = await resend.emails.send({
      from: "OrthoCross <onboarding@resend.dev>",
      to: [user.email],
      subject: "Thank You for Your Support - OrthoCross",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 10px;">☦️ OrthoCross</h1>
          </div>
          
          <p>Dear ${userName},</p>
          
          <p>I wanted to personally reach out to thank you from the bottom of my heart for your generous support of OrthoCross.</p>
          
          <p>Your donations have helped make this app possible, and I am deeply grateful for every contribution you've made. Though I'm sad to see your monthly donations end, I am extremely thankful that you took the time to support this ministry.</p>
          
          <p>Your generosity has been a blessing, and I pray that OrthoCross continues to be a helpful companion in your spiritual journey.</p>
          
          <p>May God bless you abundantly for your kindness and generosity.</p>
          
          <p style="margin-top: 30px;">With gratitude and prayers,</p>
          <p><strong>The OrthoCross Team</strong></p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
            <p>"Acts 20:35 - It is more blessed to give than to receive."</p>
            <p>Thank you for being part of our community.</p>
          </div>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR in send-cancellation-email", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
