// RLHF Feedback Service - Mock implementation for development
// Logs user feedback for AI output quality tracking

import { toast } from "@/hooks/use-toast";

export type FeedbackType = 
  | 'script_thumbs_up'
  | 'script_thumbs_down'
  | 'script_comparison'
  | 'metric_inaccuracy'
  | 'verdict_helpful'
  | 'verdict_not_helpful';

export type ScriptDislikeReason = 
  | 'too_long'
  | 'too_generic'
  | 'wrong_tone'
  | 'inaccurate_info';

export interface FeedbackPayload {
  type: FeedbackType;
  sessionId?: string;
  scriptId?: string;
  metricName?: string;
  reason?: ScriptDislikeReason;
  isNewVersionBetter?: boolean;
  timestamp: Date;
  additionalContext?: Record<string, unknown>;
}

/**
 * Log user feedback for AI outputs
 * In production, this would send to an analytics backend
 */
export const logFeedback = (type: FeedbackType, payload: Partial<FeedbackPayload> = {}) => {
  const fullPayload: FeedbackPayload = {
    type,
    timestamp: new Date(),
    ...payload,
  };

  // Console log for development visibility
  const logMessages: Record<FeedbackType, string> = {
    'script_thumbs_up': '👍 User liked the generated script',
    'script_thumbs_down': `👎 User disliked script${payload.reason ? ` - Reason: "${payload.reason}"` : ''}`,
    'script_comparison': `📊 Script comparison: ${payload.isNewVersionBetter ? 'New version is better' : 'Old version was better'}`,
    'metric_inaccuracy': `🚩 User flagged metric inaccuracy: "${payload.metricName}"`,
    'verdict_helpful': '✅ User found jury verdict helpful',
    'verdict_not_helpful': '❌ User found jury verdict unhelpful',
  };

  console.log('[RLHF Feedback]', logMessages[type], fullPayload);

  // Show thank you toast based on feedback type
  const toastMessages: Record<FeedbackType, { title: string; description: string }> = {
    'script_thumbs_up': {
      title: "Thanks for the feedback!",
      description: "We'll keep this style in mind.",
    },
    'script_thumbs_down': {
      title: "Thanks, we'll improve!",
      description: "Your feedback helps us get better.",
    },
    'script_comparison': {
      title: "Noted!",
      description: payload.isNewVersionBetter 
        ? "Great, we'll continue in this direction."
        : "We'll work on improving regenerations.",
    },
    'metric_inaccuracy': {
      title: "Flagged!",
      description: "We'll review this metric's accuracy.",
    },
    'verdict_helpful': {
      title: "Glad it helped!",
      description: "Thanks for letting us know.",
    },
    'verdict_not_helpful': {
      title: "Thanks for the feedback",
      description: "We'll work on better insights.",
    },
  };

  const toastData = toastMessages[type];
  if (toastData) {
    toast({
      title: toastData.title,
      description: toastData.description,
    });
  }

  return fullPayload;
};
