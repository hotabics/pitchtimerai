import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getRateLimitKey, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hook style definitions
type HookStyle = 'statistic' | 'villain' | 'story' | 'contrarian' | 'question';

const HOOK_STYLE_INSTRUCTIONS: Record<HookStyle, { name: string; instruction: string; example: string }> = {
  statistic: {
    name: "The Statistic",
    instruction: "Start with a hard, quantifiable fact that shows the scale of the problem. Use specific numbers.",
    example: "70% of food is wasted before it ever reaches a plate.",
  },
  villain: {
    name: "The Villain", 
    instruction: "Immediately identify the enemy (inefficiency, cost, time, a broken system). Make it visceral and punchy.",
    example: "Manual data entry is the silent killer of productivity.",
  },
  story: {
    name: "The Story",
    instruction: "Start with a specific micro-moment or anecdote. Ground it in time and place. Make it personal.",
    example: "Last Tuesday, I tried to buy a train ticket. 45 minutes later, I was still stuck in a queue.",
  },
  contrarian: {
    name: "The Contrarian",
    instruction: "State something counter-intuitive or provocative. Challenge assumptions. Be bold.",
    example: "Marketing is dead. Community is the new king.",
  },
  question: {
    name: "The Question",
    instruction: "Ask the audience something relatable that they'll mentally answer. Create instant engagement.",
    example: "Who here has ever lost their keys?",
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, 'regenerate-hook');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.aiGeneration);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for key: ${rateLimitKey}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const body = await req.json();
    const { 
      currentHook, 
      newStyle, 
      idea, 
      track, 
      context 
    } = body;

    if (!newStyle || !HOOK_STYLE_INSTRUCTIONS[newStyle as HookStyle]) {
      return new Response(JSON.stringify({ error: 'Invalid hook style' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const styleConfig = HOOK_STYLE_INSTRUCTIONS[newStyle as HookStyle];

    console.log(`Regenerating hook with style: ${newStyle} for idea: ${idea?.substring(0, 50)}...`);

    const systemPrompt = `You are a World-Class Pitch Coach specializing in opening statements.

Your task: Rewrite ONLY the opening hook of a pitch using a specific style.

STYLE TO USE: ${styleConfig.name}
${styleConfig.instruction}

EXAMPLE of this style: "${styleConfig.example}"

CRITICAL RULES:
1. Output ONLY the new hook text - no explanations, no quotes, no prefixes.
2. Keep similar length to the original (within 20% word count).
3. Maintain the same language as the input.
4. Do NOT use generic openings like "Imagine a world..." or "Picture this..."
5. The hook should be 1-3 sentences maximum.
6. Make it punchy, memorable, and impossible to ignore.`;

    const userPrompt = `Rewrite this opening hook using the ${styleConfig.name} style:

CURRENT HOOK:
"${currentHook}"

PROJECT CONTEXT:
- Idea: ${idea || 'Not specified'}
- Track: ${track || 'General pitch'}
${context ? `- Additional context: ${context}` : ''}

Write ONLY the new hook text. No explanations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let newHook = data.choices?.[0]?.message?.content?.trim();
    
    if (!newHook) {
      throw new Error('No content in AI response');
    }

    // Clean up any quotes or prefixes
    newHook = newHook.replace(/^["']|["']$/g, '').trim();

    console.log(`Generated new hook (${newStyle}): ${newHook.substring(0, 50)}...`);

    return new Response(JSON.stringify({ 
      newHook,
      style: newStyle,
      styleName: styleConfig.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regenerate-hook:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
