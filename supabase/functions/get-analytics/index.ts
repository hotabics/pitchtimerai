import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'get-analytics');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.analytics);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse request body for date range
    let dateRange = 7; // Default to 7 days
    try {
      const body = await req.json();
      if (body.dateRange && typeof body.dateRange === 'number') {
        dateRange = body.dateRange; // 7, 30, or 0 for all time
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (dateRange > 0) {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - dateRange);
    }

    // Get suggestion analytics data
    let suggestionQuery = supabase
      .from("suggestion_analytics")
      .select("suggestion_type, suggestion_text, selected_at");
    
    if (dateFilter) {
      suggestionQuery = suggestionQuery.gte('selected_at', dateFilter.toISOString());
    }
    
    const { data: rawData, error } = await suggestionQuery;

    // Get practice sessions data for content generation stats
    let sessionsQuery = supabase
      .from("practice_sessions")
      .select("track, entry_mode, score, wpm, filler_count, recording_duration_seconds, created_at, tone");
    
    if (dateFilter) {
      sessionsQuery = sessionsQuery.gte('created_at', dateFilter.toISOString());
    }
    
    const { data: sessionsData, error: sessionsError } = await sessionsQuery;

    // Get feedback data
    let feedbackQuery = supabase
      .from("feedback_logs")
      .select("feedback_type, created_at");
    
    if (dateFilter) {
      feedbackQuery = feedbackQuery.gte('created_at', dateFilter.toISOString());
    }
    
    const { data: feedbackData, error: feedbackError } = await feedbackQuery;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // Aggregate by suggestion type and text
    const aggregated: Record<string, { count: number; type: string; text: string }> = {};
    
    for (const row of rawData || []) {
      const key = `${row.suggestion_type}::${row.suggestion_text}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          count: 0,
          type: row.suggestion_type,
          text: row.suggestion_text,
        };
      }
      aggregated[key].count++;
    }

    // Convert to array and sort by count
    const suggestions = Object.values(aggregated)
      .sort((a, b) => b.count - a.count);

    // Get totals by type
    const byType: Record<string, number> = {};
    for (const row of rawData || []) {
      byType[row.suggestion_type] = (byType[row.suggestion_type] || 0) + 1;
    }

    // Group suggestions by day (for chart)
    const byDay: Record<string, number> = {};
    for (const row of rawData || []) {
      const day = new Date(row.selected_at).toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    // Aggregate content generation stats
    const sessions = sessionsData || [];
    const totalSessions = sessions.length;
    
    // Calculate averages
    const avgScore = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;
    const avgWpm = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.wpm || 0), 0) / sessions.length)
      : 0;
    const avgFillers = sessions.length > 0 
      ? (sessions.reduce((sum, s) => sum + (s.filler_count || 0), 0) / sessions.length).toFixed(1)
      : 0;
    const avgDuration = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.recording_duration_seconds || 0), 0) / sessions.length)
      : 0;

    // Sessions by track
    const byTrack: Record<string, number> = {};
    for (const session of sessions) {
      if (session.track) {
        byTrack[session.track] = (byTrack[session.track] || 0) + 1;
      }
    }

    // Sessions by entry mode
    const byEntryMode: Record<string, number> = {};
    for (const session of sessions) {
      const mode = session.entry_mode || 'generate';
      byEntryMode[mode] = (byEntryMode[mode] || 0) + 1;
    }

    // Sessions by tone
    const byTone: Record<string, number> = {};
    for (const session of sessions) {
      if (session.tone) {
        byTone[session.tone] = (byTone[session.tone] || 0) + 1;
      }
    }

    // Sessions by day (for chart)
    const sessionsByDay: Record<string, number> = {};
    for (const session of sessions) {
      const day = new Date(session.created_at).toISOString().split("T")[0];
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    }

    // Feedback breakdown
    const feedbackByType: Record<string, number> = {};
    for (const feedback of feedbackData || []) {
      feedbackByType[feedback.feedback_type] = (feedbackByType[feedback.feedback_type] || 0) + 1;
    }

    // Score distribution
    const scoreDistribution = {
      excellent: sessions.filter(s => s.score >= 80).length,
      good: sessions.filter(s => s.score >= 60 && s.score < 80).length,
      needsWork: sessions.filter(s => s.score < 60).length,
    };

    console.log("Analytics fetched successfully:", {
      dateRange,
      totalSuggestions: suggestions.length,
      totalSelections: rawData?.length || 0,
      totalSessions,
    });

    return new Response(
      JSON.stringify({
        // Date range info
        dateRange,
        // Existing suggestion data
        topSuggestions: suggestions.slice(0, 20),
        byType,
        byDay,
        totalSelections: rawData?.length || 0,
        // Content generation stats
        contentStats: {
          totalSessions,
          avgScore,
          avgWpm,
          avgFillers,
          avgDuration,
          byTrack,
          byEntryMode,
          byTone,
          sessionsByDay,
          scoreDistribution,
        },
        feedbackStats: {
          total: (feedbackData || []).length,
          byType: feedbackByType,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in get-analytics function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
