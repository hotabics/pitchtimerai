import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type JurorType = 'mentor' | 'reviewer' | 'shark';

interface ResponseAnalysis {
  relevance: number; // 0-100: How well the response addresses the question
  clarity: number; // 0-100: How clear and structured the response is
  confidence: number; // 0-100: Perceived confidence from word choice
  depth: number; // 0-100: How thorough the answer is
  feedback: string; // Brief feedback
  fillerCount: number; // Number of filler words detected
  wordCount: number;
}

const JUROR_ANALYSIS_PROMPTS: Record<JurorType, string> = {
  mentor: `You are evaluating a student's response with an encouraging but honest approach.
Focus on growth potential and how well they explained their thinking.
Be supportive but note areas for improvement.`,

  reviewer: `You are evaluating an academic response with rigorous standards.
Focus on methodology, evidence, and logical structure.
Be critical of vague claims and unsupported statements.`,

  shark: `You are evaluating a startup pitch response as a tough investor.
Focus on market knowledge, business acumen, and confidence.
Penalize vague answers and lack of numbers/data.`,
};

async function analyzeResponse(
  question: string,
  response: string,
  jurorType: JurorType,
  questionCategory: string,
  questionIntensity: string
): Promise<ResponseAnalysis> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const systemPrompt = `${JUROR_ANALYSIS_PROMPTS[jurorType]}

You are analyzing a response to a ${questionIntensity} intensity question in the ${questionCategory} category.

Analyze the response and output JSON with these scores (0-100):
- relevance: How well does the answer address the specific question asked?
- clarity: How clear, organized, and articulate is the response?
- confidence: How confident does the speaker sound based on word choice and phrasing?
- depth: How thorough and substantive is the answer?
- feedback: One sentence of actionable feedback
- fillerCount: Count filler words (um, uh, like, you know, basically, actually, honestly, literally)
- wordCount: Total word count

Consider question intensity:
- "low" questions: Be more lenient, these are warm-ups
- "medium" questions: Standard expectations
- "high" questions: These are killer questions, be tough but fair

Output valid JSON only.`;

  const userPrompt = `Question asked: "${question}"

Response given: "${response}"

Analyze this response.`;

  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!apiResponse.ok) {
    if (apiResponse.status === 429) {
      throw new Error('Rate limits exceeded');
    }
    throw new Error('AI gateway error');
  }

  const data = await apiResponse.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from AI');
  }

  return JSON.parse(content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, response, juror_type, question_category, question_intensity } = await req.json();

    if (!question || !response) {
      throw new Error('Question and response are required');
    }

    if (!juror_type || !['mentor', 'reviewer', 'shark'].includes(juror_type)) {
      throw new Error('Invalid juror_type');
    }

    console.log(`Analyzing response for ${juror_type} juror, category: ${question_category}`);

    const analysis = await analyzeResponse(
      question,
      response,
      juror_type as JurorType,
      question_category || 'General',
      question_intensity || 'medium'
    );

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing response:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
