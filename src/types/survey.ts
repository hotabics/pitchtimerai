/**
 * Survey System Types
 * 
 * Defines all types for the PitchPerfect survey system.
 * Supports versioning (v1, v2...) and multiple survey types.
 */

export type QuestionType = 'rating' | 'nps' | 'single_select' | 'multi_select' | 'textarea';

export type SurveyType = 'pulse' | 'experience';

export type SurveyTrigger = 'after_complete' | 'abandoned' | 'manual' | 'retention';

export interface SurveyOption {
  value: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: SurveyOption[];
  /** For multi_select - max number of selections allowed */
  maxSelections?: number;
  /** Conditional display based on parent question answer */
  showIf?: {
    questionId: string;
    values: string[];
  };
  /** Placeholder text for textarea */
  placeholder?: string;
}

export interface SurveyDefinition {
  id: string;
  version: string;
  type: SurveyType;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  /** Show progress bar */
  showProgress: boolean;
  /** Estimated time to complete */
  estimatedTime: string;
}

export interface SurveyAnswers {
  [questionId: string]: string | string[] | number;
}

export interface SurveyState {
  surveyId: string;
  answers: SurveyAnswers;
  currentQuestionIndex: number;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface SurveySubmission {
  surveyId: string;
  answers: SurveyAnswers;
  trigger: SurveyTrigger;
  submittedAt: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  /** Extracted properties for analytics */
  npsScore?: number;
  frictionTags?: string[];
  goalType?: string;
}

/** Track which surveys a user has completed */
export interface SurveyHistory {
  [surveyId: string]: {
    completedAt: string;
    trigger: SurveyTrigger;
  };
}

/** Session tracking for survey triggers */
export interface SessionStats {
  completedSessions14d: number;
  consecutiveStoppedSessions: number;
  lastSessionCompletedAt?: string;
  lastSessionDurationSec?: number;
  lastSessionCompletionReason?: 'finished' | 'stopped';
}
