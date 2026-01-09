import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsReportRequest {
  recipients: string[];
  period: "weekly" | "monthly";
}

function formatTypeName(type: string): string {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, period }: AnalyticsReportRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients specified");
    }

    // Fetch analytics data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const dateRange = period === "weekly" ? 7 : 30;
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - dateRange);

    // Fetch sessions
    const { data: sessions } = await supabase
      .from("practice_sessions")
      .select("track, score, wpm, filler_count, created_at")
      .gte('created_at', periodStart.toISOString());

    // Fetch previous period for comparison
    const previousPeriodEnd = new Date(periodStart);
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - dateRange);

    const { data: prevSessions } = await supabase
      .from("practice_sessions")
      .select("track, score")
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', previousPeriodEnd.toISOString());

    // Fetch suggestions
    const { data: suggestions } = await supabase
      .from("suggestion_analytics")
      .select("suggestion_type")
      .gte('selected_at', periodStart.toISOString());

    // Fetch feedback
    const { data: feedback } = await supabase
      .from("feedback_logs")
      .select("feedback_type")
      .gte('created_at', periodStart.toISOString());

    const currentSessions = sessions || [];
    const previousSessionsData = prevSessions || [];
    const suggestionData = suggestions || [];
    const feedbackData = feedback || [];

    // Calculate stats
    const totalSessions = currentSessions.length;
    const prevTotalSessions = previousSessionsData.length;
    const sessionChange = prevTotalSessions > 0 
      ? Math.round(((totalSessions - prevTotalSessions) / prevTotalSessions) * 100)
      : (totalSessions > 0 ? 100 : 0);

    const avgScore = totalSessions > 0 
      ? Math.round(currentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions)
      : 0;
    const prevAvgScore = previousSessionsData.length > 0 
      ? Math.round(previousSessionsData.reduce((sum, s) => sum + (s.score || 0), 0) / previousSessionsData.length)
      : 0;
    const scoreChange = prevAvgScore > 0 
      ? Math.round(((avgScore - prevAvgScore) / prevAvgScore) * 100)
      : (avgScore > 0 ? 100 : 0);

    const avgWpm = totalSessions > 0 
      ? Math.round(currentSessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / totalSessions)
      : 0;

    // Track breakdown
    const byTrack: Record<string, number> = {};
    for (const session of currentSessions) {
      if (session.track) {
        byTrack[session.track] = (byTrack[session.track] || 0) + 1;
      }
    }

    // Feedback counts
    const thumbsUp = feedbackData.filter(f => 
      f.feedback_type === 'script_thumbs_up' || f.feedback_type === 'verdict_helpful'
    ).length;
    const thumbsDown = feedbackData.filter(f => 
      f.feedback_type === 'script_thumbs_down' || f.feedback_type === 'verdict_not_helpful'
    ).length;

    const periodLabel = period === "weekly" ? "Weekly" : "Monthly";
    const dateRangeLabel = `${periodStart.toLocaleDateString()} - ${now.toLocaleDateString()}`;

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .content { padding: 32px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
    .stat-change { font-size: 14px; margin-top: 4px; }
    .stat-change.positive { color: #10b981; }
    .stat-change.negative { color: #ef4444; }
    .stat-change.neutral { color: #6b7280; }
    .section { margin-top: 24px; }
    .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px; }
    .track-list { background: #f9fafb; border-radius: 8px; padding: 16px; }
    .track-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .track-item:last-child { border-bottom: none; }
    .feedback-row { display: flex; gap: 24px; margin-top: 12px; }
    .feedback-item { display: flex; align-items: center; gap: 8px; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${periodLabel} Analytics Report</h1>
      <p>${dateRangeLabel}</p>
    </div>
    <div class="content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalSessions}</div>
          <div class="stat-label">Sessions</div>
          <div class="stat-change ${sessionChange >= 0 ? 'positive' : 'negative'}">
            ${sessionChange >= 0 ? '↑' : '↓'} ${Math.abs(sessionChange)}% vs prev
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgScore}</div>
          <div class="stat-label">Avg Score</div>
          <div class="stat-change ${scoreChange >= 0 ? 'positive' : 'negative'}">
            ${scoreChange >= 0 ? '↑' : '↓'} ${Math.abs(scoreChange)}% vs prev
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgWpm}</div>
          <div class="stat-label">Avg WPM</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${suggestionData.length}</div>
          <div class="stat-label">Suggestions Used</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📈 Usage by Track</div>
        <div class="track-list">
          ${Object.entries(byTrack).length > 0 
            ? Object.entries(byTrack)
                .sort(([, a], [, b]) => b - a)
                .map(([track, count]) => `
                  <div class="track-item">
                    <span>${formatTypeName(track)}</span>
                    <strong>${count}</strong>
                  </div>
                `).join('')
            : '<div style="text-align: center; color: #6b7280;">No sessions recorded</div>'
          }
        </div>
      </div>

      <div class="section">
        <div class="section-title">👍 User Feedback</div>
        <div class="feedback-row">
          <div class="feedback-item">
            <span style="color: #10b981;">👍</span>
            <strong>${thumbsUp}</strong> positive
          </div>
          <div class="feedback-item">
            <span style="color: #ef4444;">👎</span>
            <strong>${thumbsDown}</strong> negative
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>This report was automatically generated by PitchPal Analytics</p>
      <p>View full dashboard at your app</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Analytics <onboarding@resend.dev>",
      to: recipients,
      subject: `📊 ${periodLabel} Analytics Report - ${dateRangeLabel}`,
      html,
    });

    console.log("Analytics report sent successfully:", { recipients, period, emailResponse });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending analytics report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
