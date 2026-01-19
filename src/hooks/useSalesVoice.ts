import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeWithElevenLabs } from '@/services/transcription';
import { toast } from 'sonner';

interface UseSalesVoiceOptions {
  onTranscript?: (text: string) => void;
  autoSpeak?: boolean;
}

interface UseSalesVoiceReturn {
  // TTS
  isSpeaking: boolean;
  speakText: (text: string, voiceId?: string) => Promise<void>;
  stopSpeaking: () => void;
  
  // STT
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  
  // Voice mode
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
}

// Voice IDs for different personalities
const VOICE_MAP: Record<string, string> = {
  skeptical: 'JBFqnCBsd6RMkjVDRZzb', // George - deeper, serious
  neutral: 'onwK4e9ZLuTAKqWW03F9',   // Daniel - balanced
  busy: 'iP95p4xoKVk53GoZ742B',      // Chris - quick, direct
  friendly: 'TX3LPaxmHKxFdv7VOQHJ',  // Liam - warm, approachable
  default: 'JBFqnCBsd6RMkjVDRZzb',   // George as default
};

export const useSalesVoice = (options: UseSalesVoiceOptions = {}): UseSalesVoiceReturn => {
  const { onTranscript, autoSpeak = true } = options;
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Text-to-Speech using ElevenLabs
  const speakText = useCallback(async (text: string, voiceId?: string) => {
    if (!voiceEnabled && !options.autoSpeak) return;
    
    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const selectedVoice = voiceId || VOICE_MAP.default;
      
      // Use fetch directly for binary audio data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text, 
            voiceId: selectedVoice 
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      // Don't show toast for every TTS error as it can be noisy
    }
  }, [voiceEnabled, options.autoSpeak]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  // Speech-to-Text using ElevenLabs
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }
      
      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Minimum recording length check
          if (audioBlob.size < 1000) {
            toast.error('Recording too short. Please speak longer.');
            resolve(null);
            return;
          }
          
          const result = await transcribeWithElevenLabs(audioBlob);
          
          if (result.text && result.text.trim()) {
            onTranscript?.(result.text);
            resolve(result.text);
          } else {
            toast.error('No speech detected. Please try again.');
            resolve(null);
          }
          
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Failed to transcribe. Please try again.');
          resolve(null);
        } finally {
          setIsTranscribing(false);
          audioChunksRef.current = [];
        }
      };
      
      mediaRecorderRef.current.stop();
    });
  }, [onTranscript]);

  return {
    isSpeaking,
    speakText,
    stopSpeaking,
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    voiceEnabled,
    setVoiceEnabled,
  };
};

// Helper to get voice ID for personality
export const getVoiceForPersonality = (personality: string): string => {
  return VOICE_MAP[personality.toLowerCase()] || VOICE_MAP.default;
};
