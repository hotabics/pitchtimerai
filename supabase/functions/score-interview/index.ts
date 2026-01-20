import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { simulation_id } = await req.json();

    if (!simulation_id) {
      return new Response(
        JSON.stringify({ error: 'Simulation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch simulation and turns
    const { data: simulation, error: simError } = await supabaseClient
      .from('interview_simulations')
      .select('*')
      .eq('id', simulation_id)
      .single();

    if (simError || !simulation) {
      throw new Error('Simulation not found');
    }

    const { data: turns, error: turnsError } = await supabaseClient
      .from('interview_simulation_turns')
      .select('*')
      .eq('simulation_id', simulation_id)
      .order('turn_number', { ascending: true });

    if (turnsError) throw turnsError;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build conversation transcript
    const transcript = turns?.map(t => 
      `${t.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${t.content}`
    ).join('\n\n') || '';

    const systemPrompt = `You are an expert career coach and interview analyst. You evaluate interview performances with strategic insight, focusing on how well candidates connect their experience to job requirements.

Your analysis follows the "Strategic Honesty" principle – never suggest lying, but always identify how existing experience can be reframed more powerfully.`;

    const userPrompt = `Analyze this job interview performance and provide a comprehensive assessment.

JOB POSITION: ${simulation.job_title} at ${simulation.company_name || 'Company'}

JOB REQUIREMENTS:
${simulation.job_description}

CANDIDATE CV SUMMARY:
${simulation.cv_content?.substring(0, 2000)}

MATCH ANALYSIS:
Strengths: ${JSON.stringify(simulation.match_strengths || [])}
Gaps: ${JSON.stringify(simulation.match_gaps || [])}
Key Evidence: ${JSON.stringify(simulation.key_evidence || [])}

INTERVIEW TRANSCRIPT:
${transcript}

Provide a detailed analysis with:
1. Hireability Score (0-100) - realistic assessment of hiring chances
2. Category scores for: First Impression, Technical Competence, Cultural Fit, Communication, Gap Handling
3. Strategic Reframes - for each weak answer, how could they have said it better using their actual CV
4. Verdict summary - 2-3 sentences on overall performance`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'interview_assessment',
            description: 'Provide comprehensive interview performance assessment',
            parameters: {
              type: 'object',
              properties: {
                hireability_score: {
                  type: 'number',
                  description: 'Overall hiring likelihood 0-100'
                },
                category_scores: {
                  type: 'object',
                  properties: {
                    first_impression: { type: 'number' },
                    technical_competence: { type: 'number' },
                    cultural_fit: { type: 'number' },
                    communication: { type: 'number' },
                    gap_handling: { type: 'number' }
                  }
                },
                strategic_reframes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question_topic: { type: 'string' },
                      what_they_said: { type: 'string' },
                      strategic_reframe: { type: 'string' },
                      cv_evidence_to_use: { type: 'string' }
                    },
                    required: ['question_topic', 'what_they_said', 'strategic_reframe']
                  }
                },
                verdict_summary: {
                  type: 'string',
                  description: '2-3 sentence overall assessment'
                },
                conversion_likelihood: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Likelihood of advancing to next round'
                },
                top_strengths: {
                  type: 'array',
                  items: { type: 'string' }
                },
                areas_to_improve: {
                  type: 'array',
                  items: { type: 'string' }
                },
                interviewer_perspective: {
                  type: 'string',
                  description: 'What the interviewer likely thought'
                }
              },
              required: ['hireability_score', 'category_scores', 'strategic_reframes', 'verdict_summary', 'conversion_likelihood']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'interview_assessment' } }
      }),
    });

    if (!response.ok) {
      throw new Error(`Scoring failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No assessment returned');
    }

    const assessment = JSON.parse(toolCall.function.arguments);

    // Update simulation with scores
    const { error: updateError } = await supabaseClient
      .from('interview_simulations')
      .update({
        hireability_score: assessment.hireability_score,
        category_scores: assessment.category_scores,
        strategic_reframes: assessment.strategic_reframes,
        verdict_summary: assessment.verdict_summary,
        conversion_likelihood: assessment.conversion_likelihood,
        status: 'completed'
      })
      .eq('id', simulation_id);

    if (updateError) {
      console.error('Failed to update simulation:', updateError);
    }

    console.log('Interview scored:', {
      simulationId: simulation_id,
      hireability: assessment.hireability_score,
      likelihood: assessment.conversion_likelihood
    });

    return new Response(
      JSON.stringify({ success: true, ...assessment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scoring error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Scoring failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
