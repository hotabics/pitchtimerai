import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INTERVIEWER_SYSTEM_PROMPT = `You are "The Interviewer" – a seasoned HR professional conducting a first-round job interview. Your demeanor is professional, probing, and slightly intimidating but fair.

RULES:
1. Ask ONE question at a time, directly related to the job requirements and CV
2. Questions should test whether the candidate's experience genuinely meets job needs
3. Follow up on vague or evasive answers with probing questions
4. Note when the candidate mentions something from their CV that's relevant
5. Maintain a formal, authoritative tone

Your questions should feel strategic – like you're testing the candidate's ability to connect their experience to the role. Be thorough but fair.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      simulation_id,
      user_response, 
      is_opening, 
      context 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { 
      job_title, 
      company_name, 
      job_description, 
      cv_content,
      match_gaps,
      key_evidence,
      conversation_history,
      current_question_number
    } = context;

    let userPrompt: string;

    if (is_opening) {
      userPrompt = `You are interviewing a candidate for: ${job_title} at ${company_name || 'a company'}.

JOB REQUIREMENTS:
${job_description}

CANDIDATE BACKGROUND:
${cv_content}

KNOWN GAPS TO PROBE:
${JSON.stringify(match_gaps || [], null, 2)}

Begin the interview with a professional greeting and your first question. The question should test a key requirement for this role.`;
    } else {
      userPrompt = `INTERVIEW CONTEXT:
Position: ${job_title} at ${company_name || 'the company'}
Question ${current_question_number || 1} of 5-7

CANDIDATE RESPONSE:
"${user_response}"

CONVERSATION HISTORY:
${conversation_history?.map((turn: any) => `${turn.role.toUpperCase()}: ${turn.content}`).join('\n\n') || 'No prior conversation'}

GAPS TO PROBE:
${JSON.stringify(match_gaps || [], null, 2)}

KEY CV EVIDENCE TO WATCH FOR:
${JSON.stringify(key_evidence || [], null, 2)}

Based on the candidate's response, either:
1. Ask a follow-up question if their answer was vague or incomplete
2. Move to a new question about a different job requirement
3. If this is question 5-7 and the interview feels complete, ask a closing question

Remember: You're testing if this candidate can genuinely do the job.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'interviewer_turn',
            description: 'Generate the interviewer\'s next question or statement',
            parameters: {
              type: 'object',
              properties: {
                interviewer_message: {
                  type: 'string',
                  description: 'The interviewer\'s spoken message (question or statement)'
                },
                question_type: {
                  type: 'string',
                  enum: ['opening', 'behavioral', 'technical', 'situational', 'gap_probe', 'follow_up', 'closing'],
                  description: 'Type of interview question'
                },
                targeted_requirement: {
                  type: 'string',
                  description: 'Which job requirement this question tests'
                },
                response_assessment: {
                  type: 'object',
                  properties: {
                    strategic_score: { type: 'number', description: 'How well did they answer (1-10)' },
                    evidence_used: { type: 'array', items: { type: 'string' } },
                    missed_opportunities: { type: 'array', items: { type: 'string' } },
                    suggested_reframe: { type: 'string' }
                  }
                },
                is_final_question: {
                  type: 'boolean',
                  description: 'Whether this is the final question of the interview'
                }
              },
              required: ['interviewer_message', 'question_type']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'interviewer_turn' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No response from interviewer AI');
    }

    const turn = JSON.parse(toolCall.function.arguments);

    console.log('Interviewer turn:', {
      type: turn.question_type,
      isFinal: turn.is_final_question
    });

    return new Response(
      JSON.stringify(turn),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Interview turn error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Interview error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
