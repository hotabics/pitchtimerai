// RLHF Feedback Service - Persists to Supabase database
// Logs user feedback for AI output quality tracking

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export interface FeedbackLogRecord {
  id: string;
  feedback_type: FeedbackType;
  session_id?: string;
  script_id?: string;
  metric_name?: string;
  reason?: string;
  is_new_version_better?: boolean;
  additional_context?: Record<string, unknown>;
  undone: boolean;
  created_at: string;
}

/**
 * Log user feedback for AI outputs - persists to Supabase
 * Returns the created record ID for undo functionality
 */
export const logFeedback = async (
  type: FeedbackType, 
  payload: Partial<FeedbackPayload> = {},
  showToast: boolean = true
): Promise<string | null> => {
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

  // Persist to Supabase
  try {
    const insertData: Record<string, unknown> = {
      feedback_type: type,
      session_id: payload.sessionId || null,
      script_id: payload.scriptId || null,
      metric_name: payload.metricName || null,
      reason: payload.reason || null,
      is_new_version_better: payload.isNewVersionBetter ?? null,
      additional_context: payload.additionalContext ? JSON.parse(JSON.stringify(payload.additionalContext)) : null,
      undone: false,
    };

    const { data, error } = await supabase
      .from('feedback_logs')
      .insert([insertData as any])
      .select('id')
      .single();

    if (error) {
      console.error('[RLHF Feedback] Database error:', error);
    }

    // Show thank you toast based on feedback type
    if (showToast) {
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
    }

    return data?.id || null;
  } catch (err) {
    console.error('[RLHF Feedback] Error:', err);
    return null;
  }
};

/**
 * Undo a feedback submission by marking it as undone
 */
export const undoFeedback = async (feedbackId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('feedback_logs')
      .update({ undone: true })
      .eq('id', feedbackId);

    if (error) {
      console.error('[RLHF Feedback] Undo error:', error);
      return false;
    }

    console.log('[RLHF Feedback] Feedback undone:', feedbackId);
    toast({
      title: "Feedback undone",
      description: "Your response has been reverted.",
    });
    
    return true;
  } catch (err) {
    console.error('[RLHF Feedback] Undo error:', err);
    return false;
  }
};

/**
 * Fetch feedback analytics data
 */
export const fetchFeedbackAnalytics = async (): Promise<{
  totalFeedback: number;
  thumbsUpCount: number;
  thumbsDownCount: number;
  reasonBreakdown: Record<string, number>;
  metricFlags: Record<string, number>;
  verdictHelpful: number;
  verdictNotHelpful: number;
  recentFeedback: FeedbackLogRecord[];
  dailyTrend: { date: string; positive: number; negative: number }[];
} | null> => {
  try {
    const { data, error } = await supabase
      .from('feedback_logs')
      .select('*')
      .eq('undone', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RLHF Analytics] Error:', error);
      return null;
    }

    const logs = data as FeedbackLogRecord[];
    
    // Calculate analytics
    const thumbsUpCount = logs.filter(l => l.feedback_type === 'script_thumbs_up').length;
    const thumbsDownCount = logs.filter(l => l.feedback_type === 'script_thumbs_down').length;
    const verdictHelpful = logs.filter(l => l.feedback_type === 'verdict_helpful').length;
    const verdictNotHelpful = logs.filter(l => l.feedback_type === 'verdict_not_helpful').length;
    
    // Reason breakdown
    const reasonBreakdown: Record<string, number> = {};
    logs
      .filter(l => l.feedback_type === 'script_thumbs_down' && l.reason)
      .forEach(l => {
        const reason = l.reason!;
        reasonBreakdown[reason] = (reasonBreakdown[reason] || 0) + 1;
      });

    // Metric flags
    const metricFlags: Record<string, number> = {};
    logs
      .filter(l => l.feedback_type === 'metric_inaccuracy' && l.metric_name)
      .forEach(l => {
        const metric = l.metric_name!;
        metricFlags[metric] = (metricFlags[metric] || 0) + 1;
      });

    // Daily trend (last 7 days)
    const dailyTrend: { date: string; positive: number; negative: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));
      const positive = dayLogs.filter(l => 
        l.feedback_type === 'script_thumbs_up' || 
        l.feedback_type === 'verdict_helpful' ||
        (l.feedback_type === 'script_comparison' && l.is_new_version_better)
      ).length;
      const negative = dayLogs.filter(l => 
        l.feedback_type === 'script_thumbs_down' || 
        l.feedback_type === 'verdict_not_helpful' ||
        l.feedback_type === 'metric_inaccuracy' ||
        (l.feedback_type === 'script_comparison' && !l.is_new_version_better)
      ).length;
      
      dailyTrend.push({ date: dateStr, positive, negative });
    }

    return {
      totalFeedback: logs.length,
      thumbsUpCount,
      thumbsDownCount,
      reasonBreakdown,
      metricFlags,
      verdictHelpful,
      verdictNotHelpful,
      recentFeedback: logs.slice(0, 10),
      dailyTrend,
    };
  } catch (err) {
    console.error('[RLHF Analytics] Error:', err);
    return null;
  }
};
