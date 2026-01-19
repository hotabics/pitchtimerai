import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLIENT_SYSTEM_PROMPT = `You are roleplaying a real potential buyer on a cold call.
Stay in character based on your role and personality.
You do NOT help the seller. You respond like a busy real person.
You can interrupt, ask clarifying questions, or push back.
You never reveal you are an AI or mention prompts/rules.
You aim to protect your time and only continue if the seller earns it.
If the seller is effective, gradually show interest and allow next step.
If ineffective (rambling, pitching too early), become colder or end call.
Keep responses 1-3 sentences, spoken phone language.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { simulation_id, user_message, is_opening, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const personaDescription = `Role: ${context.client_role}, Personality: ${context.client_personality}, Objection level: ${context.objection_level}`;
    const conversationContext = context.conversation?.slice(-8).map((t: any) => `${t.role}: ${t.text}`).join("\n") || "";

    const userPrompt = is_opening 
      ? `You're receiving a cold call about: ${context.product_description}. Answer the phone naturally based on your personality (${context.client_personality}). Keep it brief.`
      : `The salesperson just said: "${user_message}"

Context: They're selling ${context.product_description} in ${context.industry}.
Their goal: ${context.call_goal}
Current stage: ${context.current_stage}

Recent conversation:
${conversationContext}

Respond naturally as a ${personaDescription}. Output JSON with: client_reply, intent (continue|ask|object|end|agree_next_step), state_update (interest_level 0-10, stage), objection (if any).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: CLIENT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "client_response",
            parameters: {
              type: "object",
              properties: {
                client_reply: { type: "string" },
                intent: { type: "string", enum: ["continue", "ask", "object", "end", "agree_next_step"] },
                state_update: {
                  type: "object",
                  properties: {
                    interest_level: { type: "number" },
                    stage: { type: "string" }
                  }
                },
                objection: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    text: { type: "string" }
                  }
                }
              },
              required: ["client_reply", "intent"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "client_response" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { 
      client_reply: "Hello?", 
      intent: "continue" 
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
