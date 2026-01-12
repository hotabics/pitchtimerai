// Pitch Analysis Service - GPT Analysis via Lovable AI Gateway
// Uses cloud-based AI for content analysis without requiring user API keys

import { supabase } from '@/integrations/supabase/client';

export interface PitchAnalysisResult {
  score: number;
  key_missing_points: string[];
  sentiment: string;
  specific_feedback: string;
  strengths: string[];
  recommendations: string[];
}

/**
 * Analyze pitch content using the generate-pitch edge function's analysis capability
 * or a dedicated analysis edge function
 */
export const analyzePitchWithAI = async (transcript: string): Promise<PitchAnalysisResult> => {
  // Use the existing generate-pitch function which has OpenAI configured
  const { data, error } = await supabase.functions.invoke('analyze-pitch-content', {
    body: { transcript },
  });

  if (error) {
    console.error('Pitch analysis error:', error);
    throw new Error(error.message || 'Analysis failed');
  }

  return data;
};

/**
 * Mock analysis for fallback when API is unavailable
 */
export const getMockAnalysis = (): PitchAnalysisResult => ({
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
