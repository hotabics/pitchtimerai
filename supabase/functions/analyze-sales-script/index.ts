import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are an expert sales script coach. Analyze cold call scripts and provide improvements." 
          },
          { 
            role: "user", 
            content: `Analyze this cold call script and provide improvements:\n\n${script}` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "script_analysis",
            parameters: {
              type: "object",
              properties: {
                improved_script: { type: "string" },
                feedback_items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["weakness", "suggestion", "strength"] },
                      section: { type: "string" },
                      original: { type: "string" },
                      improved: { type: "string" },
                      explanation: { type: "string" }
                    }
                  }
                },
                overall_assessment: { type: "string" }
              },
              required: ["improved_script", "feedback_items", "overall_assessment"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "script_analysis" } }
      }),
    });

    if (!response.ok) throw new Error(`AI request failed: ${response.status}`);

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
