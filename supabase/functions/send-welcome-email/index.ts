import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username }: WelcomeEmailRequest = await req.json();
    const displayName = username || "Friend";

    const emailResponse = await resend.emails.send({
      from: "OrthoCross <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to OrthoCross! ✝️",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 30px 0;
                background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
                color: white;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
              }
              .feature {
                padding: 15px;
                margin: 15px 0;
                background: #f5f5f5;
                border-radius: 8px;
                border-left: 4px solid #8B4513;
              }
              .feature-title {
                font-weight: bold;
                color: #8B4513;
                margin-bottom: 5px;
              }
              .cta-button {
                display: inline-block;
                padding: 15px 30px;
                background: #8B4513;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 14px;
                border-radius: 0 0 10px 10px;
                background: #f9f9f9;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✝️ Welcome to OrthoCross!</h1>
              <p>Your journey in Orthodox faith begins today</p>
            </div>
            
            <div class="content">
              <p>Dear ${displayName},</p>
              
              <p>Welcome to the OrthoCross community! We're thrilled to have you join us on this spiritual journey through Scripture, Orthodox history, and the lives of the saints.</p>
              
              <div class="feature">
                <div class="feature-title">📖 Daily Bible Reading</div>
                <p>Build a consistent reading habit with personalized reminders and track your progress through Scripture.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">🔥 Maintain Your Streak</div>
                <p>Stay motivated with daily reading streaks and compete with friends on the leaderboard.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">🕊️ Fasting Calendar</div>
                <p>Get reminders for Orthodox fasting periods and feast days according to your tradition.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">✨ Learn Orthodox History</div>
                <p>Discover the rich history of Orthodox Christianity through interactive campaigns.</p>
              </div>
              
              <div class="feature">
                <div class="feature-title">👥 Connect with Friends</div>
                <p>Share your spiritual journey, compare progress, and encourage one another.</p>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Getting Started:</strong><br>
                1. Complete your profile<br>
                2. Set up your notification preferences<br>
                3. Choose your reading plan<br>
                4. Start building your streak!
              </p>
              
              <p>May God bless your journey through His Word!</p>
              
              <p style="margin-top: 30px;">
                <em>In Christ,<br>
                The OrthoCross Team</em>
              </p>
            </div>
            
            <div class="footer">
              <p>OrthoCross - Your Orthodox Faith Companion</p>
              <p style="font-size: 12px; color: #999;">
                You're receiving this email because you created an account with OrthoCross.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
