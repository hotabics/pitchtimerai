import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JuryQuestion {
  category: 'Problem' | 'Innovation' | 'Technical Feasibility' | 'Business Model' | 'Risk';
  question: string;
  why_they_ask: string;
}

interface JuryQuestionsResult {
  summary: string;
  questions: JuryQuestion[];
}

const SYSTEM_PROMPT = `You are a hackathon jury member evaluating a pitch.

Your role is to ask thoughtful, realistic questions based on what you just heard.
You are not hostile, but you are critical and curious.

Rules:
- Ask questions that are directly triggered by the pitch content or what is missing.
- Do NOT ask generic startup questions.
- Do NOT repeat the same idea in multiple questions.
- Focus on clarity, innovation, feasibility, and real-world impact.
- Assume the pitch was 2–3 minutes long.
- Output valid JSON only.`;

function buildUserPrompt(transcript: string, eventsJson: object, primaryIssueKey: string): string {
  return `This is a hackathon pitch transcript:

${transcript}

Detected pitch gaps and signals:
${JSON.stringify(eventsJson, null, 2)}

Primary improvement area:
${primaryIssueKey}

Generate hackathon jury-style questions that would likely be asked after this pitch.

Output JSON in this format:

{
  "summary": string,
  "questions": [
    {
      "category": "Problem | Innovation | Technical Feasibility | Business Model | Risk",
      "question": string,
      "why_they_ask": string
    }
  ]
}

Constraints:
- Generate 5–7 questions total.
- Each question must relate to the pitch content or a detected gap.
- Keep questions concise and realistic.
- Categories must be one of the listed values.
- Output JSON only.`;
}

async function generateJuryQuestions(
  transcript: string,
  eventsJson: object,
  primaryIssueKey: string
): Promise<JuryQuestionsResult> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const userPrompt = buildUserPrompt(transcript, eventsJson, primaryIssueKey);

  console.log('Generating jury questions via Lovable AI...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'output_jury_questions',
            description: 'Output the jury questions in structured format',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'A brief summary of the pitch and areas of focus for questions',
                },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: {
                        type: 'string',
                        enum: ['Problem', 'Innovation', 'Technical Feasibility', 'Business Model', 'Risk'],
                      },
                      question: {
                        type: 'string',
                        description: 'The jury question',
                      },
                      why_they_ask: {
                        type: 'string',
                        description: 'Brief explanation of why a jury would ask this',
                      },
                    },
                    required: ['category', 'question', 'why_they_ask'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['summary', 'questions'],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'output_jury_questions' } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required, please add funds to your Lovable AI workspace.');
    }
    const errorText = await response.text();
    console.error('AI gateway error:', response.status, errorText);
    throw new Error('AI gateway error');
  }

  const data = await response.json();
  console.log('AI response:', JSON.stringify(data, null, 2));

  // Extract the tool call response
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'output_jury_questions') {
    throw new Error('Unexpected AI response format');
  }

  const result = JSON.parse(toolCall.function.arguments) as JuryQuestionsResult;
  
  // Validate and limit to 7 questions
  if (result.questions && result.questions.length > 7) {
    result.questions = result.questions.slice(0, 7);
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, track, transcript, events_json, primary_issue_key } = await req.json();

    // Validate inputs
    if (!session_id) {
      throw new Error('session_id is required');
    }
    if (track !== 'hackathon_jury') {
      throw new Error('This endpoint only supports hackathon_jury track');
    }
    if (!transcript || transcript.trim().length < 50) {
      throw new Error('Transcript is too short');
    }

    console.log(`Generating jury questions for session: ${session_id}`);

    // Generate questions
    const juryQuestions = await generateJuryQuestions(
      transcript,
      events_json || {},
      primary_issue_key || 'none'
    );

    console.log(`Generated ${juryQuestions.questions.length} jury questions`);

    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        jury_questions_json: juryQuestions,
      })
      .eq('id', session_id);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      throw new Error('Failed to save jury questions');
    }

    return new Response(
      JSON.stringify({
        success: true,
        jury_questions: juryQuestions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating jury questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
