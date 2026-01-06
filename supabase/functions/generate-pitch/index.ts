import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { type, idea, context } = await req.json();
    console.log(`Generating ${type} for idea: ${idea}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'problems':
        systemPrompt = 'You are a startup pitch expert. Generate realistic problem statements that a startup could solve.';
        userPrompt = `For a startup idea about "${idea}", generate 3 unique problem statements that this solution could address. 
        Return a JSON array with objects containing "id" (1, 2, 3), "title" (short 3-5 word title), and "description" (one sentence problem statement mentioning "${idea}").
        Only return valid JSON, no markdown.`;
        break;

      case 'persona':
        systemPrompt = 'You are a market research expert specializing in target audience definition.';
        userPrompt = `For a startup idea about "${idea}", create a primary target persona.
        Return a JSON object with:
        - "description": A 2-sentence description of who this persona is
        - "keywords": An array of 5-6 relevant demographic/psychographic keywords
        Only return valid JSON, no markdown.`;
        break;

      case 'pitches':
        systemPrompt = 'You are a pitch deck expert who creates compelling elevator pitches using analogy-based frameworks.';
        userPrompt = `For a startup idea about "${idea}", create 3 different elevator pitch variations using famous company analogies.
        Return a JSON array with objects containing:
        - "id" (1, 2, 3)
        - "title" (e.g., "The Uber Model", "The Netflix Approach")
        - "pitch" (A compelling one-liner using the analogy, mentioning "${idea}")
        Only return valid JSON, no markdown.`;
        break;

      case 'script':
        systemPrompt = 'You are an expert pitch coach who creates compelling, time-appropriate pitch scripts.';
        const { duration, problem, persona, pitch, businessModels, demo } = context;
        userPrompt = `Create a ${duration}-minute pitch script for this startup:
        
        Idea: ${idea}
        Problem: ${problem}
        Target Audience: ${persona}
        Elevator Pitch: ${pitch}
        Business Models: ${businessModels.join(', ')}
        ${demo?.hasDemo ? `Demo: ${demo.demoType} - ${demo.demoDescription}` : 'No demo'}
        
        Return a JSON object with:
        - "script": The full pitch script as a string with clear sections (Hook, Problem, Solution, ${demo?.hasDemo ? 'Demo, ' : ''}Business Model, Call to Action)
        - "demoActions": ${demo?.hasDemo ? `An array of 3-4 specific demo actions based on ${demo.demoType}` : 'null'}
        Only return valid JSON, no markdown.`;
        break;

      default:
        throw new Error(`Unknown generation type: ${type}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse the JSON from the response
    let parsed;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response');
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pitch:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
