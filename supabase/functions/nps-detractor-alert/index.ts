/**
 * NPS Detractor Alert
 * 
 * Sends real-time alerts when a user submits a detractor NPS score (0-6).
 * Notifies the team immediately so they can take action.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetractorAlertRequest {
  npsScore: number;
  surveyId: string;
  goalType?: string;
  frictionTags?: string[];
  feedbackText?: string;
  deviceType?: string;
  distinctId?: string;
  timestamp?: string;
}

// Goal type label mapping
const GOAL_LABELS: Record<string, string> = {
  'investor_pitch': 'Investor pitch',
  'sales_demo': 'Sales / demo pitch',
  'job_interview': 'Job interview',
  'school_hackathon': 'School / hackathon pitch',
  'other': 'Other',
};

// Friction point label mapping
const FRICTION_LABELS: Record<string, string> = {
  'ai_generic': 'AI feedback felt too generic',
  'timer_not_helpful': "Timer / pacing wasn't helpful",
  'didnt_know_start': "Didn't know where to start",
  'confusing_ui': 'UI was confusing',
  'technical_issues': 'Technical issues',
  'privacy': 'Privacy concerns',
  'ai_accuracy': 'AI accuracy concerns',
  'too_many_steps': 'Too many steps',
  'no_progress': 'No progress tracking',
  'price': 'Price concerns',
  'other': 'Other',
};

function getScoreEmoji(score: number): string {
  if (score <= 2) return '🔴';
  if (score <= 4) return '🟠';
  return '🟡';
}

function getScoreLabel(score: number): string {
  if (score <= 2) return 'Very Unhappy';
  if (score <= 4) return 'Unhappy';
  return 'Neutral-Negative';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: DetractorAlertRequest = await req.json();
    
    console.log('Received detractor alert request:', data);

    // Validate it's actually a detractor score
    if (data.npsScore > 6) {
      return new Response(
        JSON.stringify({ success: true, message: 'Not a detractor score, no alert sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch alert recipients (team members subscribed to alerts)
    const { data: subscribers } = await supabase
      .from('analytics_subscribers')
      .select('email')
      .eq('is_active', true);

    const recipients = (subscribers || []).map(s => s.email);

    if (recipients.length === 0) {
      console.log('No recipients configured for NPS alerts');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format friction tags
    const frictionList = (data.frictionTags || [])
      .map(tag => FRICTION_LABELS[tag] || tag)
      .join(', ') || 'None specified';

    // Format goal type
    const goalLabel = data.goalType 
      ? (GOAL_LABELS[data.goalType] || data.goalType)
      : 'Not specified';

    const scoreEmoji = getScoreEmoji(data.npsScore);
    const scoreLabel = getScoreLabel(data.npsScore);
    const timestamp = data.timestamp 
      ? new Date(data.timestamp).toLocaleString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      : new Date().toLocaleString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });

    // Build alert email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fef2f2; margin: 0; padding: 20px; }
    .container { max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #fecaca; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .score-badge { display: inline-flex; align-items: center; justify-content: center; background: white; color: #dc2626; font-size: 48px; font-weight: bold; width: 80px; height: 80px; border-radius: 50%; margin: 16px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .score-label { font-size: 14px; opacity: 0.9; margin-top: 4px; }
    .content { padding: 24px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { color: #1f2937; font-weight: 500; text-align: right; max-width: 60%; }
    .friction-section { background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .friction-title { font-size: 13px; color: #92400e; font-weight: 600; margin-bottom: 8px; }
    .friction-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .friction-tag { background: #fbbf24; color: #78350f; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .feedback-section { background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .feedback-title { font-size: 13px; color: #374151; font-weight: 600; margin-bottom: 8px; }
    .feedback-text { color: #4b5563; font-size: 14px; font-style: italic; line-height: 1.5; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }
    .action-needed { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: center; }
    .action-needed strong { color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${scoreEmoji} NPS Detractor Alert</h1>
      <div class="score-badge">${data.npsScore}</div>
      <div class="score-label">${scoreLabel}</div>
    </div>
    <div class="content">
      <div class="detail-row">
        <span class="detail-label">Survey</span>
        <span class="detail-value">${data.surveyId.includes('pulse') ? 'Pulse Survey' : 'Experience Survey'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">User Goal</span>
        <span class="detail-value">${goalLabel}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">${data.deviceType || 'Unknown'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${timestamp}</span>
      </div>
      
      ${data.frictionTags && data.frictionTags.length > 0 ? `
      <div class="friction-section">
        <div class="friction-title">⚠️ Reported Friction Points</div>
        <div class="friction-tags">
          ${data.frictionTags.map(tag => `<span class="friction-tag">${FRICTION_LABELS[tag] || tag}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      
      ${data.feedbackText ? `
      <div class="feedback-section">
        <div class="feedback-title">💬 User Feedback</div>
        <div class="feedback-text">"${data.feedbackText}"</div>
      </div>
      ` : ''}
      
      <div class="action-needed">
        <strong>Action Needed:</strong> Consider reaching out to understand their experience better.
      </div>
    </div>
    <div class="footer">
      <p>This is an automated alert from PitchPerfect</p>
      <p>User ID: ${data.distinctId || 'Anonymous'}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send alert email
    const emailResponse = await resend.emails.send({
      from: 'PitchPerfect Alerts <onboarding@resend.dev>',
      to: recipients,
      subject: `${scoreEmoji} NPS Alert: Score ${data.npsScore}/10 - ${scoreLabel}`,
      html,
    });

    console.log('Detractor alert sent successfully:', {
      score: data.npsScore,
      recipients: recipients.length,
      emailResponse,
    });

    // Also store the alert in the database for tracking
    await supabase.from('survey_events').insert({
      event_type: 'nps_detractor_alert',
      survey_id: data.surveyId,
      nps_score: data.npsScore,
      friction_tags: data.frictionTags,
      goal_type: data.goalType,
      device_type: data.deviceType,
      distinct_id: data.distinctId,
      event_timestamp: data.timestamp || new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent to ${recipients.length} recipients`,
        score: data.npsScore,
        emailResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending detractor alert:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
