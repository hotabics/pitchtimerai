import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChallengeNotificationRequest {
  type: "join" | "score_beaten";
  challengeId: string;
  challengeTitle: string;
  participantName: string;
  newScore?: number;
  creatorEmail?: string;
  previousHighScore?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, challengeId, challengeTitle, participantName, newScore, creatorEmail, previousHighScore }: ChallengeNotificationRequest = await req.json();

    console.log(`Processing ${type} notification for challenge: ${challengeTitle}`);

    if (!creatorEmail) {
      console.log("No creator email provided, skipping notification");
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let subject: string;
    let htmlContent: string;

    if (type === "join") {
      subject = `🎉 ${participantName} joined your challenge!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .highlight { background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Challenger!</h1>
            </div>
            <div class="content">
              <p>Great news!</p>
              <div class="highlight">
                <strong>${participantName}</strong> has joined your pitch challenge:
                <br><br>
                <strong>"${challengeTitle}"</strong>
              </div>
              <p>The competition is heating up! Keep practicing to stay on top of the leaderboard.</p>
              <p style="text-align: center; margin-top: 30px;">
                <a href="https://pitchperfect.app/profile" class="btn">View Challenge</a>
              </p>
            </div>
            <div class="footer">
              <p>PitchPerfect - Practice makes perfect!</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = `🔥 Your high score was beaten in "${challengeTitle}"!`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .score-compare { display: flex; justify-content: space-around; margin: 20px 0; }
            .score-box { text-align: center; padding: 15px; background: white; border-radius: 8px; min-width: 120px; }
            .old-score { color: #6b7280; }
            .new-score { color: #22c55e; font-size: 24px; font-weight: bold; }
            .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚔️ Challenge Update!</h1>
            </div>
            <div class="content">
              <p><strong>${participantName}</strong> just beat your high score in:</p>
              <h2 style="text-align: center;">"${challengeTitle}"</h2>
              
              <div class="score-compare">
                <div class="score-box">
                  <div class="old-score">Previous Best</div>
                  <div style="font-size: 20px;">${((previousHighScore || 0) / 10).toFixed(1)}/10</div>
                </div>
                <div class="score-box">
                  <div style="color: #22c55e;">New High Score</div>
                  <div class="new-score">${((newScore || 0) / 10).toFixed(1)}/10</div>
                </div>
              </div>
              
              <p style="text-align: center;">Time to reclaim your throne! 👑</p>
              <p style="text-align: center; margin-top: 30px;">
                <a href="https://pitchperfect.app/profile" class="btn">Practice Now</a>
              </p>
            </div>
            <div class="footer">
              <p>PitchPerfect - Practice makes perfect!</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "PitchPerfect <notifications@resend.dev>",
      to: [creatorEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in challenge-notification function:", error);
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
