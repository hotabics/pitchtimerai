// Hook for managing saved pitch persistence
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/utils/analytics';

interface SpeechBlock {
  timeStart: string;
  timeEnd: string;
  title: string;
  content: string;
  isDemo?: boolean;
  visualCue?: string;
}

interface PitchMeta {
  targetWordCount: number;
  actualWordCount: number;
  fullScript?: string;
  bulletPoints?: string[];
  estimatedDuration?: string;
  hookStyle?: string;
}

interface SavedPitch {
  id: string;
  user_id: string;
  title: string;
  idea: string;
  audience: string | null;
  audience_label: string | null;
  track: string;
  duration_minutes: number;
  speech_blocks: SpeechBlock[];
  meta: PitchMeta | null;
  hook_style: string | null;
  generation_mode: string;
  created_at: string;
  updated_at: string;
}

interface UseSavedPitchOptions {
  idea: string;
  track: string;
  audience?: string;
  audienceLabel?: string;
  durationMinutes?: number;
  hookStyle?: string;
  generationMode?: string;
}

interface UseSavedPitchReturn {
  pitchId: string | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  savePitch: (speechBlocks: SpeechBlock[], meta: PitchMeta | null) => Promise<string | null>;
  loadPitch: (id: string) => Promise<SavedPitch | null>;
  deletePitch: (id: string) => Promise<boolean>;
  autoSaveEnabled: boolean;
}

export const useSavedPitch = (options: UseSavedPitchOptions): UseSavedPitchReturn => {
  const { isLoggedIn, user } = useUserStore();
  const [pitchId, setPitchId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{ speechBlocks: SpeechBlock[]; meta: PitchMeta | null } | null>(null);

  // Check if we have an existing pitch for this idea
  useEffect(() => {
    const findExistingPitch = async () => {
      if (!isLoggedIn || !user || !options.idea) return;
      
      try {
        const { data, error } = await supabase
          .from('saved_pitches')
          .select('id, updated_at')
          .eq('user_id', user.id)
          .eq('idea', options.idea)
          .eq('track', options.track)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data && !error) {
          setPitchId(data.id);
          setLastSavedAt(new Date(data.updated_at));
          setSaveStatus('saved');
        }
      } catch {
        // No existing pitch found, that's fine
      }
    };

    findExistingPitch();
  }, [isLoggedIn, user, options.idea, options.track]);

  const savePitch = useCallback(async (
    speechBlocks: SpeechBlock[],
    meta: PitchMeta | null
  ): Promise<string | null> => {
    if (!isLoggedIn || !user) {
      return null;
    }

    if (speechBlocks.length === 0) {
      return null;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const pitchData = {
        user_id: user.id,
        title: options.idea.slice(0, 100),
        idea: options.idea,
        audience: options.audience || null,
        audience_label: options.audienceLabel || null,
        track: options.track,
        duration_minutes: options.durationMinutes || 3,
        speech_blocks: JSON.parse(JSON.stringify(speechBlocks)),
        meta: meta ? JSON.parse(JSON.stringify(meta)) : null,
        hook_style: options.hookStyle || null,
        generation_mode: options.generationMode || 'auto',
      };

      let savedId: string;

      if (pitchId) {
        // Update existing pitch
        const { error } = await supabase
          .from('saved_pitches')
          .update({
            speech_blocks: pitchData.speech_blocks,
            meta: pitchData.meta,
            duration_minutes: pitchData.duration_minutes,
            hook_style: pitchData.hook_style,
          })
          .eq('id', pitchId);

        if (error) throw error;
        savedId = pitchId;
      } else {
        // Create new pitch
        const { data, error } = await supabase
          .from('saved_pitches')
          .insert(pitchData)
          .select('id')
          .single();

        if (error) throw error;
        savedId = data.id;
        setPitchId(savedId);
        
        trackEvent('Pitch: Saved', {
          track: options.track,
          duration: options.durationMinutes,
          generation_mode: options.generationMode,
        });
      }

      setLastSavedAt(new Date());
      setSaveStatus('saved');
      
      return savedId;
    } catch (error) {
      console.error('Failed to save pitch:', error);
      setSaveStatus('error');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [isLoggedIn, user, pitchId, options]);

  const loadPitch = useCallback(async (id: string): Promise<SavedPitch | null> => {
    if (!isLoggedIn || !user) return null;

    try {
      const { data, error } = await supabase
        .from('saved_pitches')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        speech_blocks: data.speech_blocks as unknown as SpeechBlock[],
        meta: data.meta as unknown as PitchMeta | null,
      };
    } catch (error) {
      console.error('Failed to load pitch:', error);
      return null;
    }
  }, [isLoggedIn, user]);

  const deletePitch = useCallback(async (id: string): Promise<boolean> => {
    if (!isLoggedIn || !user) return false;

    try {
      const { error } = await supabase
        .from('saved_pitches')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      if (id === pitchId) {
        setPitchId(null);
        setLastSavedAt(null);
        setSaveStatus('idle');
      }

      trackEvent('Pitch: Deleted', { pitch_id: id });
      return true;
    } catch (error) {
      console.error('Failed to delete pitch:', error);
      return false;
    }
  }, [isLoggedIn, user, pitchId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    pitchId,
    isSaving,
    lastSavedAt,
    saveStatus,
    savePitch,
    loadPitch,
    deletePitch,
    autoSaveEnabled: isLoggedIn,
  };
};

// Hook for fetching all saved pitches
export const useSavedPitches = () => {
  const { isLoggedIn, user } = useUserStore();
  const [pitches, setPitches] = useState<SavedPitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPitches = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setPitches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('saved_pitches')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPitches(data.map(p => ({
        ...p,
        speech_blocks: p.speech_blocks as unknown as SpeechBlock[],
        meta: p.meta as unknown as PitchMeta | null,
      })));
    } catch (err) {
      console.error('Failed to fetch pitches:', err);
      setError('Failed to load saved pitches');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchPitches();
  }, [fetchPitches]);

  return {
    pitches,
    isLoading,
    error,
    refetch: fetchPitches,
  };
};

export type { SavedPitch, SpeechBlock, PitchMeta };
