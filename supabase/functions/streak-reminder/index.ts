import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface StreakUser {
  user_id: string;
  email: string;
  name: string;
  current_streak: number;
  last_practice_date: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[STREAK-REMINDER] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    if (!RESEND_API_KEY) {
      logStep("RESEND_API_KEY not configured - skipping email send");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email notifications disabled - RESEND_API_KEY not configured",
        usersNotified: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get current time info
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    // Only run in evening hours (17:00-21:00 UTC, roughly evening in most timezones)
    if (currentHour < 17 || currentHour > 21) {
      logStep("Not evening hours, skipping", { currentHour });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Not evening hours, skipping streak reminders",
        usersNotified: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Find users with active streaks who haven't practiced today
    // Gather activity from multiple sources: practice_sessions, coach_analysis, interview_simulations, sales_simulations
    
    const [practiceResult, coachResult, interviewResult, salesResult] = await Promise.all([
      supabase.from("practice_sessions").select("user_id, created_at").order("created_at", { ascending: false }),
      supabase.from("coach_analysis").select("user_id, created_at").order("created_at", { ascending: false }),
      supabase.from("interview_simulations").select("user_id, created_at").order("created_at", { ascending: false }),
      supabase.from("sales_simulations").select("user_id, created_at").order("created_at", { ascending: false }),
    ]);

    if (practiceResult.error) throw new Error(`Failed to fetch practice sessions: ${practiceResult.error.message}`);

    // Combine all activity into one array
    const allActivity: { user_id: string | null; created_at: string }[] = [
      ...(practiceResult.data || []),
      ...(coachResult.data || []),
      ...(interviewResult.data || []),
      ...(salesResult.data || []),
    ];

    logStep("Combined activity sources", { 
      practice: practiceResult.data?.length || 0,
      coach: coachResult.data?.length || 0,
      interview: interviewResult.data?.length || 0,
      sales: salesResult.data?.length || 0,
    });

    // Group sessions by user and calculate streaks
    const userStreaks = new Map<string, { lastPractice: Date; streak: number }>();
    
    for (const session of allActivity) {
      if (!session.user_id) continue;
      
      const sessionDate = new Date(session.created_at);
      sessionDate.setUTCHours(0, 0, 0, 0);
      
      const existing = userStreaks.get(session.user_id);
      if (!existing || sessionDate > existing.lastPractice) {
        userStreaks.set(session.user_id, { lastPractice: sessionDate, streak: existing?.streak || 1 });
      }
    }

    // Calculate actual streaks for each user
    for (const [userId, data] of userStreaks.entries()) {
      const userSessions = allActivity
        .filter(s => s.user_id === userId)
        .map(s => {
          const d = new Date(s.created_at);
          d.setUTCHours(0, 0, 0, 0);
          return d.toISOString().split('T')[0];
        });
      
      const uniqueDates = [...new Set(userSessions)].sort().reverse();
      let streak = 0;
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedStr = expectedDate.toISOString().split('T')[0];
        
        if (uniqueDates[i] === expectedStr) {
          streak++;
        } else if (i === 0) {
          // Check yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (uniqueDates[i] === yesterday.toISOString().split('T')[0]) {
            streak = 1;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      
      data.streak = streak;
    }

    // Find users who have a streak > 0 but haven't practiced today
    const usersToNotify: StreakUser[] = [];
    const todayStr = todayStart.toISOString().split('T')[0];

    for (const [userId, data] of userStreaks.entries()) {
      const lastPracticeStr = data.lastPractice.toISOString().split('T')[0];
      
      // User has a streak but last practice was yesterday (at risk of losing streak)
      if (data.streak > 0 && lastPracticeStr !== todayStr) {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", userId)
          .single();

        if (profile?.email) {
          usersToNotify.push({
            user_id: userId,
            email: profile.email,
            name: profile.name || profile.email.split('@')[0],
            current_streak: data.streak,
            last_practice_date: lastPracticeStr,
          });
        }
      }
    }

    logStep("Users to notify", { count: usersToNotify.length });

    // Send reminder emails
    let successCount = 0;
    for (const user of usersToNotify) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "PitchPerfect <noreply@pitchtimerai.lovable.app>",
            to: [user.email],
            subject: `🔥 Don't lose your ${user.current_streak}-day streak!`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #f97316;">Hey ${user.name}! 👋</h2>
                <p>You're on a <strong>${user.current_streak}-day practice streak</strong> and it's about to expire!</p>
                <p style="font-size: 48px; text-align: center;">🔥 ${user.current_streak}</p>
                <p>Don't let your hard work go to waste. Just one quick practice session keeps your streak alive.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://pitchtimerai.lovable.app/ai-coach" 
                     style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Practice Now →
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">Keep the momentum going! 💪</p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          successCount++;
          logStep("Email sent", { email: user.email, streak: user.current_streak });
        } else {
          logStep("Email failed", { email: user.email, status: res.status });
        }
      } catch (emailError) {
        logStep("Email error", { email: user.email, error: String(emailError) });
      }
    }

    logStep("Completed", { usersNotified: successCount, total: usersToNotify.length });

    return new Response(JSON.stringify({ 
      success: true,
      usersNotified: successCount,
      totalEligible: usersToNotify.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});