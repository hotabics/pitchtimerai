/**
 * Survey Trigger Provider
 * 
 * Manages automatic survey triggering based on user behavior.
 * Wrap your app with this to enable auto-survey prompts.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SurveyModal } from './SurveyModal';
import { SurveyType, SurveyTrigger } from '@/types/survey';
import { useSurveyTrigger, updateSessionStats } from '@/hooks/useSurvey';

interface SurveyTriggerContextType {
  /** Call after a pitch session completes to potentially trigger a survey */
  onPitchSessionComplete: (durationSec: number, completionReason: 'finished' | 'stopped') => void;
  /** Manually open a specific survey */
  openSurvey: (type: SurveyType, trigger: SurveyTrigger) => void;
  /** Check if any survey is currently showing */
  isSurveyOpen: boolean;
}

const SurveyTriggerContext = createContext<SurveyTriggerContextType | null>(null);

export const useSurveyTriggerContext = () => {
  const context = useContext(SurveyTriggerContext);
  if (!context) {
    throw new Error('useSurveyTriggerContext must be used within SurveyTriggerProvider');
  }
  return context;
};

interface SurveyTriggerProviderProps {
  children: ReactNode;
}

export const SurveyTriggerProvider = ({ children }: SurveyTriggerProviderProps) => {
  const [activeSurvey, setActiveSurvey] = useState<{
    type: SurveyType;
    trigger: SurveyTrigger;
  } | null>(null);
  
  const { shouldShowPulseSurvey, shouldShowExperienceSurvey } = useSurveyTrigger();
  
  const openSurvey = useCallback((type: SurveyType, trigger: SurveyTrigger) => {
    setActiveSurvey({ type, trigger });
  }, []);
  
  const closeSurvey = useCallback(() => {
    setActiveSurvey(null);
  }, []);
  
  const onPitchSessionComplete = useCallback((
    durationSec: number,
    completionReason: 'finished' | 'stopped'
  ) => {
    // Update session stats first
    updateSessionStats(durationSec, completionReason);
    
    // Don't show survey if one is already open
    if (activeSurvey) return;
    
    // Check pulse survey trigger (after successful session)
    if (completionReason === 'finished' && shouldShowPulseSurvey(durationSec)) {
      // Small delay to not interrupt the flow
      setTimeout(() => {
        setActiveSurvey({ type: 'pulse', trigger: 'after_complete' });
      }, 2000);
      return;
    }
    
    // Check experience survey trigger (for engaged/frustrated users)
    if (shouldShowExperienceSurvey()) {
      const trigger = completionReason === 'stopped' ? 'abandoned' : 'retention';
      setTimeout(() => {
        setActiveSurvey({ type: 'experience', trigger });
      }, 2000);
    }
  }, [activeSurvey, shouldShowPulseSurvey, shouldShowExperienceSurvey]);
  
  return (
    <SurveyTriggerContext.Provider
      value={{
        onPitchSessionComplete,
        openSurvey,
        isSurveyOpen: !!activeSurvey,
      }}
    >
      {children}
      
      {/* Survey modal */}
      {activeSurvey && (
        <SurveyModal
          isOpen={!!activeSurvey}
          surveyType={activeSurvey.type}
          trigger={activeSurvey.trigger}
          onClose={closeSurvey}
        />
      )}
    </SurveyTriggerContext.Provider>
  );
};
