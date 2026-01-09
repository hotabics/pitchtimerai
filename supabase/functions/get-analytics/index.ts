import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AggregatedStats {
  totalSessions: number;
  avgScore: number;
  avgWpm: number;
  avgFillers: string;
  avgDuration: number;
  byTrack: Record<string, number>;
  byEntryMode: Record<string, number>;
  byTone: Record<string, number>;
  sessionsByDay: Record<string, number>;
  scoreDistribution: { excellent: number; good: number; needsWork: number };
}

function aggregateSessions(sessions: any[]): AggregatedStats {
  const totalSessions = sessions.length;
  
  const avgScore = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
    : 0;
  const avgWpm = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
    : 0;
  const avgFillers = sessions.length > 0 
    ? (sessions.reduce((sum, s) => sum + (s.filler_count || 0), 0) / sessions.length).toFixed(1)
    : "0";
  const avgDuration = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + (s.recording_duration_seconds || 0), 0) / sessions.length)
    : 0;

  const byTrack: Record<string, number> = {};
  const byEntryMode: Record<string, number> = {};
  const byTone: Record<string, number> = {};
  const sessionsByDay: Record<string, number> = {};

  for (const session of sessions) {
    if (session.track) {
      byTrack[session.track] = (byTrack[session.track] || 0) + 1;
    }
    const mode = session.entry_mode || 'generate';
    byEntryMode[mode] = (byEntryMode[mode] || 0) + 1;
    if (session.tone) {
      byTone[session.tone] = (byTone[session.tone] || 0) + 1;
    }
    const day = new Date(session.created_at).toISOString().split("T")[0];
    sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
  }

  const scoreDistribution = {
    excellent: sessions.filter(s => s.score >= 80).length,
    good: sessions.filter(s => s.score >= 60 && s.score < 80).length,
    needsWork: sessions.filter(s => s.score < 60).length,
  };

  return { totalSessions, avgScore, avgWpm, avgFillers, avgDuration, byTrack, byEntryMode, byTone, sessionsByDay, scoreDistribution };
}

function calculatePercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rateLimitKey = getRateLimitKey(req, 'get-analytics');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.analytics);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    let dateRange = 7;
    try {
      const body = await req.json();
      if (body.dateRange && typeof body.dateRange === 'number') {
        dateRange = body.dateRange;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date filters for current and previous periods
    const now = new Date();
    let currentPeriodStart: Date | null = null;
    let previousPeriodStart: Date | null = null;
    let previousPeriodEnd: Date | null = null;

    if (dateRange > 0) {
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - dateRange);
      
      previousPeriodEnd = new Date(currentPeriodStart);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - dateRange);
    }

    // Fetch current period data
    let suggestionQuery = supabase
      .from("suggestion_analytics")
      .select("suggestion_type, suggestion_text, selected_at");
    
    if (currentPeriodStart) {
      suggestionQuery = suggestionQuery.gte('selected_at', currentPeriodStart.toISOString());
    }
    
    const { data: rawData, error } = await suggestionQuery;

    let sessionsQuery = supabase
      .from("practice_sessions")
      .select("track, entry_mode, score, wpm, filler_count, recording_duration_seconds, created_at, tone");
    
    if (currentPeriodStart) {
      sessionsQuery = sessionsQuery.gte('created_at', currentPeriodStart.toISOString());
    }
    
    const { data: sessionsData } = await sessionsQuery;

    let feedbackQuery = supabase
      .from("feedback_logs")
      .select("feedback_type, created_at");
    
    if (currentPeriodStart) {
      feedbackQuery = feedbackQuery.gte('created_at', currentPeriodStart.toISOString());
    }
    
    const { data: feedbackData } = await feedbackQuery;

    // Fetch previous period data for comparison (only if dateRange > 0)
    let previousSessions: any[] = [];
    let previousSuggestions: any[] = [];
    let previousFeedback: any[] = [];

    if (previousPeriodStart && previousPeriodEnd) {
      const { data: prevSessData } = await supabase
        .from("practice_sessions")
        .select("track, entry_mode, score, wpm, filler_count, recording_duration_seconds, created_at, tone")
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString());
      
      previousSessions = prevSessData || [];

      const { data: prevSuggData } = await supabase
        .from("suggestion_analytics")
        .select("suggestion_type, suggestion_text, selected_at")
        .gte('selected_at', previousPeriodStart.toISOString())
        .lt('selected_at', previousPeriodEnd.toISOString());
      
      previousSuggestions = prevSuggData || [];

      const { data: prevFeedData } = await supabase
        .from("feedback_logs")
        .select("feedback_type, created_at")
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString());
      
      previousFeedback = prevFeedData || [];
    }

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // Aggregate suggestions
    const aggregated: Record<string, { count: number; type: string; text: string }> = {};
    for (const row of rawData || []) {
      const key = `${row.suggestion_type}::${row.suggestion_text}`;
      if (!aggregated[key]) {
        aggregated[key] = { count: 0, type: row.suggestion_type, text: row.suggestion_text };
      }
      aggregated[key].count++;
    }
    const suggestions = Object.values(aggregated).sort((a, b) => b.count - a.count);

    const byType: Record<string, number> = {};
    for (const row of rawData || []) {
      byType[row.suggestion_type] = (byType[row.suggestion_type] || 0) + 1;
    }

    const byDay: Record<string, number> = {};
    for (const row of rawData || []) {
      const day = new Date(row.selected_at).toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    // Current period stats
    const sessions = sessionsData || [];
    const currentStats = aggregateSessions(sessions);
    const previousStats = aggregateSessions(previousSessions);

    // Feedback breakdown
    const feedbackByType: Record<string, number> = {};
    for (const feedback of feedbackData || []) {
      feedbackByType[feedback.feedback_type] = (feedbackByType[feedback.feedback_type] || 0) + 1;
    }

    // Calculate comparison metrics
    const comparison = dateRange > 0 ? {
      sessions: calculatePercentChange(currentStats.totalSessions, previousStats.totalSessions),
      avgScore: calculatePercentChange(currentStats.avgScore, previousStats.avgScore),
      avgWpm: calculatePercentChange(currentStats.avgWpm, previousStats.avgWpm),
      suggestions: calculatePercentChange((rawData || []).length, previousSuggestions.length),
      feedback: calculatePercentChange((feedbackData || []).length, previousFeedback.length),
      previousPeriod: {
        sessions: previousStats.totalSessions,
        avgScore: previousStats.avgScore,
        suggestions: previousSuggestions.length,
        feedback: previousFeedback.length,
      }
    } : null;

    console.log("Analytics fetched successfully:", {
      dateRange,
      totalSuggestions: suggestions.length,
      totalSelections: rawData?.length || 0,
      totalSessions: currentStats.totalSessions,
      comparison: comparison ? { sessionChange: comparison.sessions, scoreChange: comparison.avgScore } : null,
    });

    return new Response(
      JSON.stringify({
        dateRange,
        topSuggestions: suggestions.slice(0, 20),
        byType,
        byDay,
        totalSelections: rawData?.length || 0,
        contentStats: currentStats,
        feedbackStats: {
          total: (feedbackData || []).length,
          byType: feedbackByType,
        },
        comparison,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-analytics function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
