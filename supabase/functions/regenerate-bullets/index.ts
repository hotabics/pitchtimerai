import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { script } = await req.json();

    if (!script || typeof script !== 'string' || script.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: 'Script content is required (min 20 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error("AI service not configured");
    }

    console.log('Regenerating bullet points for script length:', script.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a pitch coach. Extract 4-6 key bullet points from the provided script.
Each bullet point should:
- Be concise (under 15 words)
- Capture a key message or takeaway
- Be ordered by their appearance in the script
- Focus on memorable talking points

Return ONLY a JSON object with a "bulletPoints" array of strings. No markdown, no explanation.
Example: {"bulletPoints": ["Opening hook about the problem", "Market size is $X billion", "Our solution saves 50% time", "Call to action for investment"]}`
          },
          {
            role: "user",
            content: script
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI gateway error');
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let bulletPoints: string[];
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      
      const parsed = JSON.parse(jsonStr);
      bulletPoints = parsed.bulletPoints || parsed.bullets || [];
      
      if (!Array.isArray(bulletPoints)) {
        throw new Error('bulletPoints is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: split by lines and clean up
      bulletPoints = content
        .split('\n')
        .map((line: string) => line.replace(/^[-•*\d.)\]]+\s*/, '').trim())
        .filter((line: string) => line.length > 10 && line.length < 200)
        .slice(0, 6);
    }

    console.log('Generated bullet points:', bulletPoints.length);

    return new Response(
      JSON.stringify({ bulletPoints }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regenerate-bullets:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to regenerate bullet points' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
