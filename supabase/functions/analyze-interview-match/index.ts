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
    const { job_description, cv_content, job_title, company_name } = await req.json();

    if (!job_description || !cv_content) {
      return new Response(
        JSON.stringify({ error: 'Job description and CV content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert recruiter and career strategist analyzing a candidate's CV against a job posting. Your goal is to identify strategic matches and gaps to help the candidate prepare for an interview.

IMPORTANT: Be thorough and strategic. For each gap, think about how the candidate's existing experience can be reframed to address it.`;

    const userPrompt = `Analyze this CV against the job posting and identify:
1. The Match (Strengths) - Where the candidate's experience directly aligns with job requirements
2. The Gap (Potential Weaknesses) - Requirements the candidate doesn't obviously meet
3. Key Evidence - Specific CV items the candidate should mention in the interview
4. Strategic Reframe Opportunities - How existing experience can address gaps

JOB POSTING:
Title: ${job_title || 'Not specified'}
Company: ${company_name || 'Not specified'}
Description:
${job_description}

CANDIDATE CV:
${cv_content}

Provide strategic, actionable analysis.`;

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
            name: 'analyze_match',
            description: 'Analyze CV-Job match and return structured analysis',
            parameters: {
              type: 'object',
              properties: {
                job_requirements: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key requirements extracted from job posting'
                },
                match_strengths: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      requirement: { type: 'string' },
                      cv_evidence: { type: 'string' },
                      strength_level: { type: 'string', enum: ['strong', 'moderate', 'partial'] }
                    },
                    required: ['requirement', 'cv_evidence', 'strength_level']
                  }
                },
                match_gaps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      requirement: { type: 'string' },
                      gap_severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
                      reframe_strategy: { type: 'string' },
                      transferable_experience: { type: 'string' }
                    },
                    required: ['requirement', 'gap_severity', 'reframe_strategy']
                  }
                },
                key_evidence: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      evidence: { type: 'string' },
                      when_to_mention: { type: 'string' },
                      impact_statement: { type: 'string' }
                    },
                    required: ['evidence', 'when_to_mention']
                  }
                },
                overall_match_score: {
                  type: 'number',
                  description: 'Estimated match percentage 0-100'
                },
                interview_focus_areas: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Top 3-5 areas to focus on during interview'
                }
              },
              required: ['job_requirements', 'match_strengths', 'match_gaps', 'key_evidence', 'overall_match_score']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_match' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No analysis returned from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    console.log('Match analysis complete:', {
      matchScore: analysis.overall_match_score,
      strengths: analysis.match_strengths?.length,
      gaps: analysis.match_gaps?.length
    });

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing match:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
