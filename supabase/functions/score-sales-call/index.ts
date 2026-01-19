import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { simulation_id } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load simulation and turns
    const { data: simulation } = await supabase
      .from("sales_simulations")
      .select("*")
      .eq("id", simulation_id)
      .single();

    const { data: turns } = await supabase
      .from("sales_simulation_turns")
      .select("*")
      .eq("simulation_id", simulation_id)
      .order("turn_number");

    if (!simulation || !turns) {
      throw new Error("Simulation not found");
    }

    // Calculate metrics
    const userTurns = turns.filter((t: any) => t.role === "user");
    const clientTurns = turns.filter((t: any) => t.role === "client");
    const userWords = userTurns.reduce((sum: number, t: any) => sum + (t.word_count || 0), 0);
    const clientWords = clientTurns.reduce((sum: number, t: any) => sum + (t.content?.split(/\s+/).length || 0), 0);
    const totalWords = userWords + clientWords;
    const talkRatio = totalWords > 0 ? userWords / totalWords : 0.5;
    const questionCount = userTurns.filter((t: any) => t.is_question).length;
    const objections = clientTurns.filter((t: any) => t.objection?.type).length;

    // Simple scoring based on metrics
    const openingScore = Math.min(20, 10 + (turns.length > 0 ? 5 : 0) + (questionCount > 0 ? 5 : 0));
    const discoveryScore = Math.min(20, questionCount * 4);
    const valueScore = Math.min(20, userTurns.length > 3 ? 15 : userTurns.length * 3);
    const objectionScore = objections > 0 ? Math.min(20, 10 + (objections * 3)) : 10;
    const closeScore = Math.min(20, turns.length >= 6 ? 15 : 8);

    // Penalties
    const penalties: Record<string, number> = {};
    if (talkRatio > 0.7) penalties.over_talking = -3;
    if (talkRatio > 0.8) penalties.over_talking = -6;
    if (questionCount < 2 && userTurns.length > 2) penalties.overpitching = -3;

    const penaltyTotal = Object.values(penalties).reduce((sum, v) => sum + v, 0);
    const baseScore = openingScore + discoveryScore + valueScore + objectionScore + closeScore;
    const overallScore = Math.max(0, Math.min(100, baseScore + penaltyTotal));

    // Generate highlights and improvements
    const highlights: string[] = [];
    const improvements: string[] = [];

    if (questionCount >= 3) highlights.push("Good discovery questioning");
    if (talkRatio < 0.6) highlights.push("Effective listening ratio");
    if (turns.length >= 8) highlights.push("Sustained engagement");

    if (talkRatio > 0.6) improvements.push("Let the client speak more");
    if (questionCount < 3) improvements.push("Ask more discovery questions");
    if (turns.length < 6) improvements.push("Work on extending the conversation");

    const conversionLikelihood = overallScore >= 70 ? "high" : overallScore >= 50 ? "medium" : "low";

    // Update simulation
    await supabase
      .from("sales_simulations")
      .update({
        opening_score: openingScore,
        discovery_score: discoveryScore,
        value_score: valueScore,
        objection_score: objectionScore,
        close_score: closeScore,
        overall_score: overallScore,
        penalties,
        highlights,
        improvements,
        talk_ratio: talkRatio,
        question_count: questionCount,
        objections_raised: objections,
        conversion_likelihood: conversionLikelihood,
      })
      .eq("id", simulation_id);

    return new Response(JSON.stringify({ 
      success: true, 
      overall_score: overallScore,
      conversion_likelihood: conversionLikelihood
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
