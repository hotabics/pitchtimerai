// Hook for managing AI Coach analysis persistence
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { trackEvent } from '@/utils/analytics';

interface DeliveryMetrics {
  eyeContactPercent?: number;
  wpm?: number;
  fillerCount?: number;
  fillerBreakdown?: Record<string, number>;
  stabilityScore?: number;
  smilePercent?: number;
  postureScore?: number;
  postureGrade?: string;
  handsVisiblePercent?: number;
  bodyStabilityScore?: number;
}

interface ContentAnalysis {
  score?: number;
  sentiment?: string;
  strengths?: string[];
  missingElements?: string[];
  investorQuote?: string;
  recommendations?: string[];
  tone?: string;
}

interface CoachAnalysisData {
  id: string;
  user_id: string;
  pitch_id: string | null;
  overall_score: number | null;
  transcript: string | null;
  delivery_metrics: DeliveryMetrics | null;
  content_analysis: ContentAnalysis | null;
  recommendations: string[] | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  prompt_mode: string | null;
  created_at: string;
}

interface SaveAnalysisParams {
  pitchId?: string | null;
  overallScore?: number;
  transcript?: string;
  deliveryMetrics?: DeliveryMetrics;
  contentAnalysis?: ContentAnalysis;
  recommendations?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  promptMode?: string;
}

interface UseCoachAnalysisReturn {
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveAnalysis: (params: SaveAnalysisParams) => Promise<string | null>;
  loadAnalysis: (id: string) => Promise<CoachAnalysisData | null>;
  deleteAnalysis: (id: string) => Promise<boolean>;
}

export const useCoachAnalysis = (): UseCoachAnalysisReturn => {
  const { isLoggedIn, user } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveAnalysis = useCallback(async (params: SaveAnalysisParams): Promise<string | null> => {
    if (!isLoggedIn || !user) {
      return null;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const analysisData = {
        user_id: user.id,
        pitch_id: params.pitchId || null,
        overall_score: params.overallScore || null,
        transcript: params.transcript || null,
        delivery_metrics: params.deliveryMetrics ? JSON.parse(JSON.stringify(params.deliveryMetrics)) : null,
        content_analysis: params.contentAnalysis ? JSON.parse(JSON.stringify(params.contentAnalysis)) : null,
        recommendations: params.recommendations ? JSON.parse(JSON.stringify(params.recommendations)) : null,
        video_url: params.videoUrl || null,
        thumbnail_url: params.thumbnailUrl || null,
        duration_seconds: params.durationSeconds || null,
        prompt_mode: params.promptMode || null,
      };

      const { data, error } = await supabase
        .from('coach_analysis')
        .insert(analysisData)
        .select('id')
        .single();

      if (error) throw error;

      trackEvent('Coach Analysis: Saved', {
        overall_score: params.overallScore,
        has_video: !!params.videoUrl,
        duration_seconds: params.durationSeconds,
      });

      setSaveStatus('saved');
      return data.id;
    } catch (error) {
      console.error('Failed to save analysis:', error);
      setSaveStatus('error');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [isLoggedIn, user]);

  const loadAnalysis = useCallback(async (id: string): Promise<CoachAnalysisData | null> => {
    if (!isLoggedIn || !user) return null;

    try {
      const { data, error } = await supabase
        .from('coach_analysis')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      return {
        ...data,
        delivery_metrics: data.delivery_metrics as DeliveryMetrics | null,
        content_analysis: data.content_analysis as ContentAnalysis | null,
        recommendations: data.recommendations as string[] | null,
      };
    } catch (error) {
      console.error('Failed to load analysis:', error);
      return null;
    }
  }, [isLoggedIn, user]);

  const deleteAnalysis = useCallback(async (id: string): Promise<boolean> => {
    if (!isLoggedIn || !user) return false;

    try {
      const { error } = await supabase
        .from('coach_analysis')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      trackEvent('Coach Analysis: Deleted', { analysis_id: id });
      return true;
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      return false;
    }
  }, [isLoggedIn, user]);

  return {
    isSaving,
    saveStatus,
    saveAnalysis,
    loadAnalysis,
    deleteAnalysis,
  };
};

// Hook for fetching all coach analyses
export const useCoachAnalyses = () => {
  const { isLoggedIn, user } = useUserStore();
  const [analyses, setAnalyses] = useState<CoachAnalysisData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setAnalyses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('coach_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAnalyses(data.map(a => ({
        ...a,
        delivery_metrics: a.delivery_metrics as DeliveryMetrics | null,
        content_analysis: a.content_analysis as ContentAnalysis | null,
        recommendations: a.recommendations as string[] | null,
      })));
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
      setError('Failed to load coach analyses');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  return {
    analyses,
    isLoading,
    error,
    refetch: fetchAnalyses,
  };
};

export type { CoachAnalysisData, DeliveryMetrics, ContentAnalysis, SaveAnalysisParams };
