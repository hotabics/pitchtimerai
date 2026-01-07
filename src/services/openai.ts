// OpenAI API Service for AI Coach
// Handles Whisper transcription and GPT-4 analysis

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export interface WhisperResponse {
  text: string;
  duration?: number;
}

export interface GPTAnalysisResponse {
  score: number;
  key_missing_points: string[];
  sentiment: string;
  specific_feedback: string;
  strengths: string[];
  recommendations: string[];
}

export interface ContentCoverage {
  problem: boolean;
  solution: boolean;
  market: boolean;
  traction: boolean;
  team: boolean;
  ask: boolean;
  demo: boolean;
  uniqueValue: boolean;
}

export const getApiKey = (): string | null => {
  return localStorage.getItem('openai_api_key');
};

export const setApiKey = (key: string): void => {
  localStorage.setItem('openai_api_key', key);
};

export const removeApiKey = (): void => {
  localStorage.removeItem('openai_api_key');
};

export const hasApiKey = (): boolean => {
  const key = getApiKey();
  return !!key && key.length > 10;
};

// Transcribe audio using Whisper API
export const transcribeAudio = async (audioBlob: Blob): Promise<WhisperResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'json');

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || 'Failed to transcribe audio');
  }

  return response.json();
};

// Analyze pitch content using GPT-4
export const analyzePitchContent = async (transcript: string): Promise<GPTAnalysisResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a critical Hackathon Judge with 10+ years of experience evaluating startup pitches. 
  
Analyze the following pitch transcript and return a JSON object with exactly these fields:
- score: number from 1-10 (be honest and critical)
- key_missing_points: array of strings (what crucial elements are missing?)
- sentiment: string (one of: "Confident", "Hesitant", "Nervous", "Passionate", "Monotone", "Engaging")
- specific_feedback: string (2-3 sentences of direct feedback)
- strengths: array of 2-3 strings (what they did well)
- recommendations: array of 3-5 strings (actionable improvements)

Be specific and constructive. Reference actual content from the pitch.`;

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this pitch:\n\n${transcript}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || 'Failed to analyze pitch');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Failed to parse GPT response');
  }
};

// Detect content coverage from transcript
export const detectContentCoverage = (transcript: string): ContentCoverage => {
  const lowerTranscript = transcript.toLowerCase();
  
  return {
    problem: /problem|pain|issue|challenge|struggle|difficult|frustrat/i.test(lowerTranscript),
    solution: /solution|solve|fix|address|approach|built|created|developed/i.test(lowerTranscript),
    market: /market|industry|billion|million|users|customers|segment|tam|sam/i.test(lowerTranscript),
    traction: /traction|users|revenue|growth|customers|mau|dau|arpu|retention/i.test(lowerTranscript),
    team: /team|founder|co-founder|experience|background|built|years/i.test(lowerTranscript),
    ask: /ask|raise|seeking|investment|funding|round|capital/i.test(lowerTranscript),
    demo: /demo|show|let me|watch|see|work|here's/i.test(lowerTranscript),
    uniqueValue: /unique|different|unlike|first|only|better|competitive|advantage/i.test(lowerTranscript),
  };
};

// Calculate filler word count
export const countFillerWords = (transcript: string): { total: number; breakdown: Record<string, number> } => {
  const fillerPatterns: Record<string, RegExp> = {
    'um': /\bum+\b/gi,
    'uh': /\buh+\b/gi,
    'like': /\blike\b/gi,
    'you know': /\byou know\b/gi,
    'basically': /\bbasically\b/gi,
    'actually': /\bactually\b/gi,
    'so': /^so\b|\.\s+so\b/gi,
    'right': /\bright\??\b/gi,
  };

  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const [word, pattern] of Object.entries(fillerPatterns)) {
    const matches = transcript.match(pattern);
    const count = matches ? matches.length : 0;
    if (count > 0) {
      breakdown[word] = count;
      total += count;
    }
  }

  return { total, breakdown };
};

// Calculate words per minute
export const calculateWPM = (transcript: string, durationSeconds: number): number => {
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;
  const minutes = durationSeconds / 60;
  return Math.round(wordCount / minutes);
};

// Mock data for fallback when no API key
export const getMockAnalysis = (): GPTAnalysisResponse => ({
  score: 7,
  key_missing_points: [
    'Missing clear business model explanation',
    'No competitive landscape mentioned',
    'Team credentials not highlighted',
  ],
  sentiment: 'Confident',
  specific_feedback: 'Your pitch shows passion but lacks critical business metrics. Consider adding traction data and a clear ask.',
  strengths: [
    'Clear problem articulation',
    'Engaging opening hook',
  ],
  recommendations: [
    'Add specific numbers and metrics',
    'Clearly state your funding ask',
    'Mention key team members and their expertise',
    'Address competitive advantages more explicitly',
    'Include a memorable closing statement',
  ],
});
