/**
 * Survey Definitions
 * 
 * Contains all survey content for PitchPerfect.
 * Version controlled - update version when changing questions.
 */

import { SurveyDefinition } from '@/types/survey';

/**
 * Pulse Survey v1
 * Quick 30-45 second survey after session completion
 */
export const PULSE_SURVEY_V1: SurveyDefinition = {
  id: 'pitchperfect_pulse_v1',
  version: 'v1',
  type: 'pulse',
  title: 'Quick Feedback',
  description: 'Help us improve in 30 seconds',
  showProgress: false,
  estimatedTime: '30 sec',
  questions: [
    {
      id: 'q1_usefulness',
      type: 'rating',
      text: 'How useful was this session?',
      required: true,
    },
    {
      id: 'q2_goal',
      type: 'single_select',
      text: 'What was your main goal today?',
      required: true,
      options: [
        { value: 'investor_pitch', label: 'Investor pitch' },
        { value: 'sales_demo', label: 'Sales / demo pitch' },
        { value: 'job_interview', label: 'Job interview self-presentation' },
        { value: 'school_hackathon', label: 'School / hackathon pitch' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q2a_goal_other',
      type: 'textarea',
      text: 'Please describe your goal',
      required: true,
      placeholder: 'Describe your goal...',
      showIf: {
        questionId: 'q2_goal',
        values: ['other'],
      },
    },
    {
      id: 'q3_frustrations',
      type: 'multi_select',
      text: 'What frustrated you the most?',
      required: true,
      options: [
        { value: 'didnt_know_start', label: "I didn't know where to start" },
        { value: 'timer_not_helpful', label: "The timer / pacing wasn't helpful" },
        { value: 'ai_generic', label: 'AI feedback felt too generic' },
        { value: 'technical_issues', label: 'Microphone / permissions / technical issues' },
        { value: 'confusing_ui', label: 'The UI was confusing' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q3a_frustration_other',
      type: 'textarea',
      text: 'Please describe the issue',
      required: true,
      placeholder: 'Describe the issue...',
      showIf: {
        questionId: 'q3_frustrations',
        values: ['other'],
      },
    },
    {
      id: 'q4_improve_first',
      type: 'textarea',
      text: 'In one sentence: what should we improve first?',
      required: true,
      placeholder: 'Your suggestion...',
    },
  ],
};

/**
 * Experience Survey v1
 * Comprehensive 2-4 minute survey for engaged users
 */
export const EXPERIENCE_SURVEY_V1: SurveyDefinition = {
  id: 'pitchperfect_experience_v1',
  version: 'v1',
  type: 'experience',
  title: 'Help Shape PitchPerfect',
  description: 'Your detailed feedback helps us build better features',
  showProgress: true,
  estimatedTime: '3 min',
  questions: [
    // B1 — Context
    {
      id: 'q1_use_case',
      type: 'single_select',
      text: 'What do you use PitchPerfect for most often?',
      required: true,
      options: [
        { value: 'investor_pitch', label: 'Investor pitch' },
        { value: 'sales_demo', label: 'Sales / demo pitch' },
        { value: 'job_interview', label: 'Job interview self-presentation' },
        { value: 'school_hackathon', label: 'School / hackathon pitch' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q1a_use_case_other',
      type: 'textarea',
      text: 'Please describe your use case',
      required: true,
      placeholder: 'Describe your use case...',
      showIf: {
        questionId: 'q1_use_case',
        values: ['other'],
      },
    },
    {
      id: 'q2_experience',
      type: 'single_select',
      text: 'Your experience with pitch training tools:',
      required: true,
      options: [
        { value: 'none', label: 'None (this is my first)' },
        { value: 'tried_once', label: 'Tried once or twice' },
        { value: 'regular', label: 'I practice regularly' },
      ],
    },
    {
      id: 'q3_device',
      type: 'single_select',
      text: 'Which device do you mostly use?',
      required: true,
      options: [
        { value: 'phone', label: 'Phone' },
        { value: 'desktop', label: 'Desktop / laptop' },
        { value: 'tablet', label: 'Tablet' },
      ],
    },

    // B2 — Core Flow
    {
      id: 'q4_achieved_goal',
      type: 'single_select',
      text: 'Did you achieve what you came to do?',
      required: true,
      options: [
        { value: 'yes', label: 'Yes, completely' },
        { value: 'partially', label: 'Partially' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      id: 'q4a_what_missing',
      type: 'textarea',
      text: 'What was missing or broken?',
      required: true,
      placeholder: 'Describe what was missing...',
      showIf: {
        questionId: 'q4_achieved_goal',
        values: ['partially', 'no'],
      },
    },
    {
      id: 'q5_confusion_point',
      type: 'single_select',
      text: 'Where did you feel the most confusion?',
      required: true,
      options: [
        { value: 'onboarding', label: 'At the start / onboarding' },
        { value: 'settings', label: 'Choosing settings or mode' },
        { value: 'recording', label: 'Starting the recording / timer' },
        { value: 'ai_feedback', label: 'Understanding AI feedback' },
        { value: 'next_steps', label: 'Knowing what to do next' },
        { value: 'none', label: 'I had no confusion' },
      ],
    },

    // B3 — AI Feedback Quality
    {
      id: 'q6a_ai_specific',
      type: 'rating',
      text: 'The AI feedback was specific (not generic)',
      required: true,
    },
    {
      id: 'q6b_ai_understandable',
      type: 'rating',
      text: 'The AI feedback was easy to understand',
      required: true,
    },
    {
      id: 'q6c_ai_relevant',
      type: 'rating',
      text: 'The AI feedback felt relevant to my situation',
      required: true,
    },
    {
      id: 'q6d_ai_actionable',
      type: 'rating',
      text: 'The AI feedback was actionable for my next attempt',
      required: true,
    },
    {
      id: 'q7_ai_missing',
      type: 'single_select',
      text: 'What was missing most from the AI feedback?',
      required: true,
      options: [
        { value: 'examples', label: 'Concrete examples or rewritten sentences' },
        { value: 'structure', label: 'Clear structure (hook–problem–solution–ask)' },
        { value: 'training_plan', label: 'A clear next-step training plan' },
        { value: 'voice_analysis', label: 'Voice pacing / pauses / speed analysis' },
        { value: 'audience_advice', label: 'Audience-specific advice (investor vs customer)' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q7a_ai_missing_other',
      type: 'textarea',
      text: 'Please describe what was missing',
      required: true,
      placeholder: 'Describe what was missing...',
      showIf: {
        questionId: 'q7_ai_missing',
        values: ['other'],
      },
    },

    // B4 — Timer & Training Mechanics
    {
      id: 'q8_timer_helpful',
      type: 'rating',
      text: 'The timer helped me maintain good pacing',
      required: true,
    },
    {
      id: 'q9_preferred_format',
      type: 'single_select',
      text: 'Which format would be most useful?',
      required: true,
      options: [
        { value: '30s', label: '30s elevator pitch' },
        { value: '60s', label: '60s pitch' },
        { value: '3min', label: '3-minute demo pitch' },
        { value: '5min', label: '5-minute investor pitch' },
        { value: 'custom', label: 'Custom' },
      ],
    },
    {
      id: 'q9a_custom_format',
      type: 'textarea',
      text: 'Describe the ideal length or structure',
      required: true,
      placeholder: 'Describe your ideal format...',
      showIf: {
        questionId: 'q9_preferred_format',
        values: ['custom'],
      },
    },

    // B5 — Barriers & Trust
    {
      id: 'q10_barriers',
      type: 'multi_select',
      text: 'What might prevent you from using PitchPerfect more often?',
      required: true,
      options: [
        { value: 'privacy', label: 'Privacy / recording safety concerns' },
        { value: 'ai_accuracy', label: 'AI accuracy or reliability' },
        { value: 'too_many_steps', label: 'Too many steps' },
        { value: 'no_progress', label: 'No progress tracking' },
        { value: 'price', label: 'Price' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q10a_barriers_other',
      type: 'textarea',
      text: 'Please describe the barrier',
      required: true,
      placeholder: 'Describe the barrier...',
      showIf: {
        questionId: 'q10_barriers',
        values: ['other'],
      },
    },

    // B6 — Improvement Priorities
    {
      id: 'q11_priorities',
      type: 'multi_select',
      text: 'Which TWO improvements would bring the most value?',
      required: true,
      maxSelections: 2,
      options: [
        { value: 'onboarding', label: 'Clearer onboarding (1-minute "how it works")' },
        { value: 'templates', label: 'Pitch templates (investor / sales / interview)' },
        { value: 'progress_dashboard', label: 'Progress dashboard (history + improvements)' },
        { value: 'ai_examples', label: 'AI examples (rewritten sentences)' },
        { value: 'voice_metrics', label: 'Voice metrics (pauses / speed / clarity)' },
        { value: 'export_share', label: 'Export or sharing options' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      id: 'q11a_priorities_other',
      type: 'textarea',
      text: 'Please describe the improvement',
      required: true,
      placeholder: 'Describe the improvement...',
      showIf: {
        questionId: 'q11_priorities',
        values: ['other'],
      },
    },

    // B7 — NPS & Pricing
    {
      id: 'q12_nps',
      type: 'nps',
      text: 'How likely are you to recommend PitchPerfect to a friend?',
      required: true,
    },
    {
      id: 'q13_nps_improve',
      type: 'textarea',
      text: 'What would need to change for you to give +2 more points?',
      required: false,
      placeholder: 'Your thoughts...',
    },
    {
      id: 'q14_pricing',
      type: 'single_select',
      text: 'What would you be willing to pay per month?',
      required: false,
      options: [
        { value: '$0', label: '$0' },
        { value: '$5', label: '$5' },
        { value: '$10', label: '$10' },
        { value: '$20', label: '$20' },
        { value: '$50+', label: '$50+' },
      ],
    },
  ],
};

export const SURVEYS = {
  pulse: PULSE_SURVEY_V1,
  experience: EXPERIENCE_SURVEY_V1,
} as const;

export const getSurveyById = (id: string): SurveyDefinition | undefined => {
  return Object.values(SURVEYS).find(s => s.id === id);
};
