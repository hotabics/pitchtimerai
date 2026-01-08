// Hook for generating and syncing TTS voiceover with teleprompter

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ScriptBlock } from '@/stores/aiCoachStore';

export interface VoiceoverState {
  isGenerating: boolean;
  isReady: boolean;
  audioUrl: string | null;
  currentBlockIndex: number;
  blockTimestamps: { start: number; end: number }[];
  error: string | null;
}

export interface UseTeleprompterVoiceoverReturn {
  state: VoiceoverState;
  generateVoiceover: (scriptBlocks: ScriptBlock[], voiceId?: string) => Promise<void>;
  getCurrentBlockFromTime: (currentTime: number) => number;
  reset: () => void;
}

const VOICE_OPTIONS = {
  male: '21m00Tcm4TlvDq8ikWAM', // Rachel
  female: 'EXAVITQu4vr4xnSDxMaL', // Bella
  professional: 'onwK4e9ZLuTAKqWW03F9', // Daniel
};

export const useTeleprompterVoiceover = (): UseTeleprompterVoiceoverReturn => {
  const [state, setState] = useState<VoiceoverState>({
    isGenerating: false,
    isReady: false,
    audioUrl: null,
    currentBlockIndex: 0,
    blockTimestamps: [],
    error: null,
  });

  const audioUrlRef = useRef<string | null>(null);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const generateVoiceover = useCallback(async (scriptBlocks: ScriptBlock[], voiceId?: string) => {
    if (scriptBlocks.length === 0) return;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Combine all script blocks into full text
      const fullText = scriptBlocks
        .map(block => `${block.content}`)
        .join(' ... '); // Natural pause between sections

      // Estimate timestamps based on word count (roughly 150 WPM average for TTS)
      const WPM = 150;
      const blockTimestamps: { start: number; end: number }[] = [];
      let currentTime = 0;

      scriptBlocks.forEach(block => {
        const wordCount = block.content.split(/\s+/).length;
        const pauseTime = 0.5; // 0.5 second pause between blocks
        const duration = (wordCount / WPM) * 60;
        
        blockTimestamps.push({
          start: currentTime,
          end: currentTime + duration,
        });
        
        currentTime += duration + pauseTime;
      });

      // Call the ElevenLabs TTS function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: fullText,
            voiceId: voiceId || VOICE_OPTIONS.professional,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'TTS generation failed' }));
        throw new Error(error.error || 'Failed to generate voiceover');
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Get actual duration from audio
      const audio = new Audio(audioUrl);
      await new Promise<void>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          const actualDuration = audio.duration;
          const estimatedDuration = blockTimestamps[blockTimestamps.length - 1]?.end || 1;
          const scale = actualDuration / estimatedDuration;

          // Scale timestamps to match actual audio duration
          blockTimestamps.forEach(ts => {
            ts.start *= scale;
            ts.end *= scale;
          });

          resolve();
        });
        audio.addEventListener('error', () => resolve()); // Continue even if metadata fails
      });

      setState({
        isGenerating: false,
        isReady: true,
        audioUrl,
        currentBlockIndex: 0,
        blockTimestamps,
        error: null,
      });
    } catch (error) {
      console.error('Voiceover generation error:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate voiceover',
      }));
    }
  }, []);

  const getCurrentBlockFromTime = useCallback((currentTime: number): number => {
    const { blockTimestamps } = state;
    
    for (let i = 0; i < blockTimestamps.length; i++) {
      const { start, end } = blockTimestamps[i];
      if (currentTime >= start && currentTime < end) {
        return i;
      }
    }

    // If past all blocks, return last block
    if (currentTime >= (blockTimestamps[blockTimestamps.length - 1]?.end || 0)) {
      return blockTimestamps.length - 1;
    }

    return 0;
  }, [state.blockTimestamps]);

  const reset = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setState({
      isGenerating: false,
      isReady: false,
      audioUrl: null,
      currentBlockIndex: 0,
      blockTimestamps: [],
      error: null,
    });
  }, []);

  return {
    state,
    generateVoiceover,
    getCurrentBlockFromTime,
    reset,
  };
};
