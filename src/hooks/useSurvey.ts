/**
 * Survey Hook
 * 
 * Manages survey state, autosave, and submission logic.
 * Integrates with PostHog for event tracking.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SurveyDefinition, 
  SurveyAnswers, 
  SurveyState, 
  SurveyQuestion,
  SurveyTrigger,
  SurveyHistory,
  SessionStats
} from '@/types/survey';
import { SURVEYS, getSurveyById } from '@/data/surveyDefinitions';
import { trackEvent } from '@/utils/analytics';

const STORAGE_KEY_PREFIX = 'pitchperfect_survey_';
const HISTORY_KEY = 'pitchperfect_survey_history';
const SESSION_STATS_KEY = 'pitchperfect_session_stats';

// Helper to detect device type
const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Get survey history from localStorage
export const getSurveyHistory = (): SurveyHistory => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

// Check if user has completed a specific survey
export const hasCompletedSurvey = (surveyId: string): boolean => {
  const history = getSurveyHistory();
  return !!history[surveyId];
};

// Get session stats for trigger logic
export const getSessionStats = (): SessionStats => {
  try {
    const data = localStorage.getItem(SESSION_STATS_KEY);
    return data ? JSON.parse(data) : {
      completedSessions14d: 0,
      consecutiveStoppedSessions: 0,
    };
  } catch {
    return {
      completedSessions14d: 0,
      consecutiveStoppedSessions: 0,
    };
  }
};

// Update session stats (call after each pitch session)
export const updateSessionStats = (
  durationSec: number,
  completionReason: 'finished' | 'stopped'
): void => {
  const stats = getSessionStats();
  
  // Update completed sessions count (simple increment, decay handled elsewhere)
  if (completionReason === 'finished') {
    stats.completedSessions14d += 1;
    stats.consecutiveStoppedSessions = 0;
  } else {
    stats.consecutiveStoppedSessions += 1;
  }
  
  stats.lastSessionCompletedAt = new Date().toISOString();
  stats.lastSessionDurationSec = durationSec;
  stats.lastSessionCompletionReason = completionReason;
  
  localStorage.setItem(SESSION_STATS_KEY, JSON.stringify(stats));
};

interface UseSurveyOptions {
  surveyType: 'pulse' | 'experience';
  trigger: SurveyTrigger;
  onComplete?: () => void;
  onDismiss?: () => void;
}

interface UseSurveyReturn {
  survey: SurveyDefinition;
  answers: SurveyAnswers;
  currentQuestionIndex: number;
  visibleQuestions: SurveyQuestion[];
  currentQuestion: SurveyQuestion | null;
  progress: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  canProceed: boolean;
  setAnswer: (questionId: string, value: string | string[] | number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  submit: () => Promise<void>;
  dismiss: () => void;
}

export const useSurvey = ({
  surveyType,
  trigger,
  onComplete,
  onDismiss,
}: UseSurveyOptions): UseSurveyReturn => {
  const survey = SURVEYS[surveyType];
  const storageKey = `${STORAGE_KEY_PREFIX}${survey.id}`;
  
  // Load saved state or initialize
  const [state, setState] = useState<SurveyState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    
    return {
      surveyId: survey.id,
      answers: {},
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate visible questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    return survey.questions.filter(q => {
      if (!q.showIf) return true;
      
      const parentAnswer = state.answers[q.showIf.questionId];
      if (!parentAnswer) return false;
      
      // Check if parent answer matches any of the trigger values
      if (Array.isArray(parentAnswer)) {
        return q.showIf.values.some(v => parentAnswer.includes(v));
      }
      return q.showIf.values.includes(parentAnswer as string);
    });
  }, [survey.questions, state.answers]);
  
  const currentQuestion = visibleQuestions[state.currentQuestionIndex] || null;
  const progress = visibleQuestions.length > 0 
    ? ((state.currentQuestionIndex + 1) / visibleQuestions.length) * 100 
    : 0;
  
  // Check if current question is answered (for required validation)
  const canProceed = useMemo(() => {
    if (!currentQuestion) return false;
    
    const answer = state.answers[currentQuestion.id];
    
    if (!currentQuestion.required) return true;
    
    if (answer === undefined || answer === null) return false;
    
    if (typeof answer === 'string' && answer.trim() === '') return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    
    return true;
  }, [currentQuestion, state.answers]);
  
  // Autosave to localStorage
  useEffect(() => {
    const updated = { ...state, lastUpdatedAt: new Date().toISOString() };
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }, [state, storageKey]);
  
  // Track survey shown on mount
  useEffect(() => {
    const stats = getSessionStats();
    trackEvent('survey_shown', {
      survey_id: survey.id,
      trigger,
      device_type: getDeviceType(),
      completed_sessions_14d: stats.completedSessions14d,
    });
  }, [survey.id, trigger]);
  
  const setAnswer = useCallback((questionId: string, value: string | string[] | number) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);
  
  const goToNext = useCallback(() => {
    if (state.currentQuestionIndex < visibleQuestions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  }, [state.currentQuestionIndex, visibleQuestions.length]);
  
  const goToPrevious = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  }, [state.currentQuestionIndex]);
  
  const submit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Extract analytics properties
      const npsScore = state.answers['q12_nps'] as number | undefined;
      const goalType = (state.answers['q1_use_case'] || state.answers['q2_goal']) as string | undefined;
      
      // Collect friction tags from multi-select answers
      const frictionTags: string[] = [];
      ['q3_frustrations', 'q10_barriers'].forEach(qId => {
        const answer = state.answers[qId];
        if (Array.isArray(answer)) {
          frictionTags.push(...answer);
        }
      });
      
      // Track survey completion
      trackEvent('survey_answered', {
        survey_id: survey.id,
        answers: state.answers,
        nps_score: npsScore,
        friction_tags: frictionTags,
        goal_type: goalType,
        device_type: getDeviceType(),
        trigger,
        timestamp: new Date().toISOString(),
      });
      
      // Save to history
      const history = getSurveyHistory();
      history[survey.id] = {
        completedAt: new Date().toISOString(),
        trigger,
      };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      
      // Clear survey state
      localStorage.removeItem(storageKey);
      
      onComplete?.();
    } catch (error) {
      console.error('Failed to submit survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, state.answers, survey.id, trigger, storageKey, onComplete]);
  
  const dismiss = useCallback(() => {
    trackEvent('survey_dismissed', {
      survey_id: survey.id,
      trigger,
      questions_answered: Object.keys(state.answers).length,
    });
    
    onDismiss?.();
  }, [survey.id, trigger, state.answers, onDismiss]);
  
  return {
    survey,
    answers: state.answers,
    currentQuestionIndex: state.currentQuestionIndex,
    visibleQuestions,
    currentQuestion,
    progress,
    isFirstQuestion: state.currentQuestionIndex === 0,
    isLastQuestion: state.currentQuestionIndex === visibleQuestions.length - 1,
    isSubmitting,
    canProceed,
    setAnswer,
    goToNext,
    goToPrevious,
    submit,
    dismiss,
  };
};

/**
 * Hook to check if a survey should be triggered
 */
export const useSurveyTrigger = () => {
  const shouldShowPulseSurvey = useCallback((
    durationSec: number
  ): boolean => {
    // Conditions: duration >= 20s and hasn't completed pulse survey
    if (durationSec < 20) return false;
    if (hasCompletedSurvey('pitchperfect_pulse_v1')) return false;
    return true;
  }, []);
  
  const shouldShowExperienceSurvey = useCallback((): boolean => {
    if (hasCompletedSurvey('pitchperfect_experience_v1')) return false;
    
    const stats = getSessionStats();
    
    // Trigger if 3+ completed sessions in last 14 days
    if (stats.completedSessions14d >= 3) return true;
    
    // Trigger if 2 consecutive stopped sessions
    if (stats.consecutiveStoppedSessions >= 2) return true;
    
    return false;
  }, []);
  
  return {
    shouldShowPulseSurvey,
    shouldShowExperienceSurvey,
  };
};
