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

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get aggregated analytics data
    const { data: rawData, error } = await supabase
      .from("suggestion_analytics")
      .select("suggestion_type, suggestion_text, selected_at");

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

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentData = (rawData || []).filter(
      (row) => new Date(row.selected_at) >= sevenDaysAgo
    );

    // Group by day
    const byDay: Record<string, number> = {};
    for (const row of recentData) {
      const day = new Date(row.selected_at).toISOString().split("T")[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    console.log("Analytics fetched successfully:", {
      totalSuggestions: suggestions.length,
      totalSelections: rawData?.length || 0,
    });

    return new Response(
      JSON.stringify({
        topSuggestions: suggestions.slice(0, 20),
        byType,
        byDay,
        totalSelections: rawData?.length || 0,
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
