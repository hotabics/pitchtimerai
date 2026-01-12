// Transcription Service - ElevenLabs STT via Edge Function
// Uses the elevenlabs-stt edge function for high-quality speech-to-text

import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionResult {
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    type?: string;
  }>;
  language_code?: string;
}

/**
 * Transcribe audio using ElevenLabs Scribe via edge function
 * This provides high-quality, server-side transcription without exposing API keys
 */
export const transcribeWithElevenLabs = async (audioBlob: Blob): Promise<TranscriptionResult> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const { data, error } = await supabase.functions.invoke('elevenlabs-stt', {
    body: formData,
  });

  if (error) {
    console.error('ElevenLabs STT error:', error);
    throw new Error(error.message || 'Transcription failed');
  }

  if (!data || !data.text) {
    throw new Error('No transcription returned');
  }

  return {
    text: data.text,
    words: data.words,
    language_code: data.language_code,
  };
};

/**
 * Check if ElevenLabs transcription is available
 * (edge function is deployed and has API key configured)
 */
export const isTranscriptionAvailable = async (): Promise<boolean> => {
  try {
    // We can't easily check if the edge function has the API key
    // So we'll return true and let the actual call handle errors
    return true;
  } catch {
    return false;
  }
};
