import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is triggered by pg_cron to send scheduled analytics reports
serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request to determine frequency (weekly or monthly)
    let frequency: "weekly" | "monthly" = "weekly";
    try {
      const body = await req.json();
      if (body.frequency) {
        frequency = body.frequency;
      }
    } catch {
      // Default to weekly
    }

    console.log(`Triggering ${frequency} analytics report...`);

    // Get active subscribers for this frequency
    const { data: subscribers, error: subError } = await supabase
      .from("analytics_subscribers")
      .select("email, name")
      .eq("frequency", frequency)
      .eq("is_active", true);

    if (subError) {
      console.error("Failed to fetch subscribers:", subError);
      throw subError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log(`No active ${frequency} subscribers found`);
      return new Response(
        JSON.stringify({ success: true, message: "No subscribers to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emails = subscribers.map(s => s.email);
    console.log(`Sending ${frequency} report to ${emails.length} subscribers:`, emails);

    // Invoke the send-analytics-report function
    const { error: invokeError } = await supabase.functions.invoke("send-analytics-report", {
      body: {
        recipients: emails,
        period: frequency,
      },
    });

    if (invokeError) {
      console.error("Failed to invoke send-analytics-report:", invokeError);
      throw invokeError;
    }

    console.log(`Successfully triggered ${frequency} report for ${emails.length} subscribers`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${frequency} report to ${emails.length} subscribers`,
        recipients: emails,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in trigger-scheduled-reports:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
