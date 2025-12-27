import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Heartfelt Bible verses about giving and generosity
const BIBLE_VERSES = [
  {
    verse: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
    reference: "2 Corinthians 9:7"
  },
  {
    verse: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.",
    reference: "Luke 6:38"
  },
  {
    verse: "Remember the words of the Lord Jesus, how he himself said, 'It is more blessed to give than to receive.'",
    reference: "Acts 20:35"
  },
  {
    verse: "Honor the Lord with your wealth and with the firstfruits of all your produce; then your barns will be filled with plenty.",
    reference: "Proverbs 3:9-10"
  },
  {
    verse: "And God is able to bless you abundantly, so that in all things at all times, having all that you need, you will abound in every good work.",
    reference: "2 Corinthians 9:8"
  },
  {
    verse: "Whoever is generous to the poor lends to the Lord, and he will repay him for his deed.",
    reference: "Proverbs 19:17"
  },
  {
    verse: "Do not neglect to do good and to share what you have, for such sacrifices are pleasing to God.",
    reference: "Hebrews 13:16"
  }
];

const logStep = (step: string, details?: any) => {
  console.log(`[DONATION-THANK-YOU] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting donation thank you process");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Could not authenticate user");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user profile for display name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .single();

    const userName = profile?.display_name || profile?.username || "Beloved Friend";

    // Select a random Bible verse
    const randomVerse = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];

    // Parse request body for optional donation details
    let donationType = "one-time";
    let amount = "";
    try {
      const body = await req.json();
      donationType = body.donationType || "one-time";
      amount = body.amount ? `$${(body.amount / 100).toFixed(2)}` : "";
    } catch {
      // Body is optional
    }

    const isMonthly = donationType === "monthly";

    // Send thank you email
    if (user.email) {
      logStep("Sending thank you email", { email: user.email });

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #2d2d2d; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .cross { font-size: 48px; color: #8b4513; }
            h1 { color: #5c3d2e; font-size: 28px; margin: 20px 0; }
            .message { background: linear-gradient(to bottom, #fdfcfb, #f8f6f3); border-radius: 12px; padding: 30px; margin: 20px 0; }
            .verse-box { background: #fff; border-left: 4px solid #8b4513; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
            .verse { font-style: italic; font-size: 16px; color: #5c3d2e; }
            .reference { font-weight: bold; color: #8b4513; margin-top: 10px; display: block; }
            .footer { text-align: center; color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            .heart { color: #c41e3a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="cross">☦</div>
              <h1>Thank You, ${userName}!</h1>
            </div>
            
            <div class="message">
              <p>Glory to God!</p>
              
              <p>From the depths of my heart, I want to thank you for your ${isMonthly ? "monthly" : ""} generous donation${amount ? ` of ${amount}` : ""}. Your kindness and faithfulness mean more than words can express.</p>
              
              <p>Your support helps spread the light of Orthodox Christianity and brings the treasures of our faith to those seeking spiritual nourishment. Through your generosity, more souls can discover the beauty of the ancient faith, the lives of the saints, and the transformative power of prayer.</p>
              
              <p>You are not just supporting an app – you are participating in the sacred work of evangelism and spiritual formation. May the Lord remember your sacrifice and reward you a hundredfold.</p>
              
              <div class="verse-box">
                <p class="verse">"${randomVerse.verse}"</p>
                <span class="reference">— ${randomVerse.reference}</span>
              </div>
              
              <p>Please know that you and your loved ones are in my prayers. May God bless you abundantly, protect you, and fill your life with His grace, peace, and joy.</p>
              
              <p>With deepest gratitude and love in Christ,<br>
              <strong>The OrthoCross Team</strong></p>
              
              <p class="heart">❤️ ☦ ❤️</p>
            </div>
            
            <div class="footer">
              <p>OrthoCross - Growing in Faith Together</p>
              <p>May the Lord bless you and keep you! 🙏</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await resend.emails.send({
        from: "OrthoCross <onboarding@resend.dev>",
        to: [user.email],
        subject: `Thank You for Your ${isMonthly ? "Monthly " : ""}Donation! ☦`,
        html: emailHtml,
      });

      logStep("Email sent successfully", { response: emailResponse });
    }

    // TODO: Add SMS sending via Twilio if phone number is available
    // This would require storing phone numbers in profiles

    return new Response(
      JSON.stringify({ success: true, message: "Thank you message sent!" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logStep("Error sending thank you", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
