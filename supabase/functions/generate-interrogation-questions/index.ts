import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type JurorType = 'mentor' | 'reviewer' | 'shark';

interface InterrogationQuestion {
  question: string;
  category: string;
  intensity: 'low' | 'medium' | 'high';
}

interface InterrogationResult {
  questions: InterrogationQuestion[];
  jurorOpening: string;
}

const JUROR_PROMPTS: Record<JurorType, string> = {
  mentor: `You are Prof. Eleanor Sage, a supportive but probing academic mentor.
Your tone is warm, encouraging, but inquisitive. You genuinely want the presenter to succeed.
Ask questions that help them think deeper, not to trip them up.
Focus on learning outcomes, growth potential, and understanding.
Style: Curious, educational, supportive with gentle challenges.`,

  reviewer: `You are Dr. Victor Stern, a harsh academic reviewer.
Your tone is cold, methodical, and unforgiving. You focus on methodology and rigor.
Ask questions that probe weaknesses in their approach, data, and conclusions.
You expect precise, evidence-based answers.
Style: Critical, analytical, demanding perfection.`,

  shark: `You are Marcus "Money" Chen, a skeptical investor known as "The Shark".
Your tone is aggressive, fast-paced, and ROI-focused.
Ask questions about market size, scalability, competitive moats, and revenue.
You have zero patience for vague answers. You want numbers.
Style: Sharp, impatient, money-focused, interrupting.`,
};

const JUROR_OPENINGS: Record<JurorType, string[]> = {
  mentor: [
    "I've reviewed your proposal with great interest. Let's explore it together.",
    "This looks promising. Help me understand your thinking here.",
    "I see potential in this. Let's dig into the details.",
  ],
  reviewer: [
    "I have concerns about your methodology. Let's begin.",
    "Your abstract was... interesting. Now defend your claims.",
    "The committee has questions. I suggest you answer carefully.",
  ],
  shark: [
    "You've got 60 seconds of my attention. Make it count.",
    "I've seen a hundred pitches today. Why shouldn't I pass on yours?",
    "Cut the fluff. Show me the money.",
  ],
};

function buildPrompt(
  jurorType: JurorType,
  dossierData?: {
    projectName?: string;
    problem?: string;
    solution?: string;
    audience?: string;
  }
): string {
  const dossierContext = dossierData
    ? `
Project Information (Dossier):
- Project Name: ${dossierData.projectName || 'Unknown'}
- Problem: ${dossierData.problem || 'Not specified'}
- Solution: ${dossierData.solution || 'Not specified'}
- Target Audience: ${dossierData.audience || 'Not specified'}
`
    : `No dossier data available. Generate generic but challenging questions for a startup/project pitch.`;

  return `${JUROR_PROMPTS[jurorType]}

${dossierContext}

Generate 5 interrogation questions that this juror would ask.
Each question should escalate in intensity from the previous one.

Output JSON format:
{
  "questions": [
    {
      "question": "The full question text",
      "category": "Problem | Solution | Feasibility | Market | Team | Risk",
      "intensity": "low | medium | high"
    }
  ]
}

Rules:
- First 2 questions should be low intensity (warm-up)
- Questions 3-4 should be medium intensity (probing)
- Question 5 should be high intensity (the killer question)
- Questions must be specific to the project if dossier data is available
- Keep questions under 100 words each
- Output valid JSON only`;
}

async function generateQuestions(
  jurorType: JurorType,
  dossierData?: {
    projectName?: string;
    problem?: string;
    solution?: string;
    audience?: string;
  }
): Promise<InterrogationResult> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const userPrompt = buildPrompt(jurorType, dossierData);

  console.log(`Generating interrogation questions for juror: ${jurorType}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a question generator for a pitch practice simulation. Output valid JSON only.' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limits exceeded, please try again later.');
    }
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error('AI gateway error');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from AI');
  }

  const parsed = JSON.parse(content);
  
  // Select random opening
  const openings = JUROR_OPENINGS[jurorType];
  const jurorOpening = openings[Math.floor(Math.random() * openings.length)];

  return {
    questions: parsed.questions || [],
    jurorOpening,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { juror_type, dossier_data } = await req.json();

    if (!juror_type || !['mentor', 'reviewer', 'shark'].includes(juror_type)) {
      throw new Error('Invalid juror_type. Must be: mentor, reviewer, or shark');
    }

    const result = await generateQuestions(juror_type as JurorType, dossier_data);

    console.log(`Generated ${result.questions.length} questions for ${juror_type}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating interrogation questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
