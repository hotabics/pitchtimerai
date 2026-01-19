import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COACH_SYSTEM_PROMPT = `You are an expert sales coach observing a cold call in real time.
Give concise, actionable guidance to increase likelihood of achieving the call goal.
You do not speak to the client. You coach the user.
Prefer coaching aligned to stages: opening → discovery → value → objections → closing.
Produce: 1-3 live tips (max 12 words each), 1 recommended next line (<=20 words), 0-2 red flags if detected.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { simulation_id, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const conversationContext = context.conversation?.slice(-6).map((t: any) => `${t.role}: ${t.text}`).join("\n") || "";

    const userPrompt = `Call goal: ${context.call_goal}
Product: ${context.product_description}
Client: ${context.client_role} (${context.client_personality})
Current stage: ${context.current_stage}

Recent conversation:
${conversationContext}

Last client message: "${context.last_client_message}"

Provide coaching for the salesperson's next response.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: COACH_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "coach_guidance",
            parameters: {
              type: "object",
              properties: {
                live_tips: { type: "array", items: { type: "string" } },
                next_best_action: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    suggested_line: { type: "string" }
                  }
                },
                red_flags: { type: "array", items: { type: "string" } },
                stage_recommendation: { type: "string" }
              },
              required: ["live_tips", "next_best_action"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "coach_guidance" } }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { 
      live_tips: [], 
      next_best_action: null,
      red_flags: []
    };

    return new Response(JSON.stringify(result), {
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
