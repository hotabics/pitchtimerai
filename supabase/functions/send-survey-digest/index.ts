/**
 * Weekly Survey Analytics Digest
 * 
 * Sends a weekly email digest with NPS trends, friction points, and survey completion stats.
 * Triggered by cron job every Monday at 9 AM UTC.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SurveyEvent {
  id: string;
  event_type: string;
  survey_id: string;
  answers: Record<string, unknown> | null;
  nps_score: number | null;
  friction_tags: string[] | null;
  goal_type: string | null;
  device_type: string | null;
  trigger: string | null;
  distinct_id: string | null;
  event_timestamp: string;
  created_at: string;
}

interface DigestRequest {
  recipients?: string[];
  testMode?: boolean;
}

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

// Goal type label mapping
const GOAL_LABELS: Record<string, string> = {
  'investor_pitch': 'Investor pitch',
  'sales_demo': 'Sales / demo pitch',
  'job_interview': 'Job interview',
  'school_hackathon': 'School / hackathon pitch',
  'other': 'Other',
};

function getNPSCategory(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

function formatChangeIndicator(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '↑ New' : '—';
  const change = Math.round(((current - previous) / previous) * 100);
  if (change > 0) return `↑ ${change}%`;
  if (change < 0) return `↓ ${Math.abs(change)}%`;
  return '→ 0%';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request (for manual triggers with custom recipients)
    let recipients: string[] = [];
    let testMode = false;
    
    try {
      const body: DigestRequest = await req.json();
      recipients = body.recipients || [];
      testMode = body.testMode || false;
    } catch {
      // No body or invalid JSON - use subscribers from database
    }

    // If no recipients specified, fetch from analytics_subscribers
    if (recipients.length === 0) {
      const { data: subscribers } = await supabase
        .from('analytics_subscribers')
        .select('email')
        .eq('is_active', true);
      
      recipients = (subscribers || []).map(s => s.email);
    }

    if (recipients.length === 0) {
      console.log('No recipients for survey digest');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating survey digest for ${recipients.length} recipients`);

    // Calculate date ranges
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    // Fetch current week survey events
    const { data: currentEvents, error: currentError } = await supabase
      .from('survey_events')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false });

    if (currentError) {
      console.error('Error fetching current events:', currentError);
    }

    // Fetch previous week for comparison
    const { data: prevEvents, error: prevError } = await supabase
      .from('survey_events')
      .select('*')
      .gte('created_at', prevWeekStart.toISOString())
      .lt('created_at', weekStart.toISOString());

    if (prevError) {
      console.error('Error fetching previous events:', prevError);
    }

    const current = (currentEvents || []) as SurveyEvent[];
    const previous = (prevEvents || []) as SurveyEvent[];

    // Filter for answered surveys
    const currentAnswered = current.filter(e => e.event_type === 'survey_answered');
    const prevAnswered = previous.filter(e => e.event_type === 'survey_answered');

    // Calculate NPS metrics
    const currentNpsScores = currentAnswered
      .map(e => e.nps_score)
      .filter((s): s is number => s !== null);
    
    const prevNpsScores = prevAnswered
      .map(e => e.nps_score)
      .filter((s): s is number => s !== null);

    const avgNps = currentNpsScores.length > 0
      ? Math.round(currentNpsScores.reduce((a, b) => a + b, 0) / currentNpsScores.length * 10) / 10
      : null;

    const prevAvgNps = prevNpsScores.length > 0
      ? Math.round(prevNpsScores.reduce((a, b) => a + b, 0) / prevNpsScores.length * 10) / 10
      : null;

    // NPS breakdown
    const promoters = currentNpsScores.filter(s => s >= 9).length;
    const passives = currentNpsScores.filter(s => s >= 7 && s < 9).length;
    const detractors = currentNpsScores.filter(s => s < 7).length;
    const totalNps = promoters + passives + detractors;

    // Calculate Net Promoter Score
    const npsScore = totalNps > 0
      ? Math.round(((promoters - detractors) / totalNps) * 100)
      : null;

    // Survey completion stats
    const currentShown = current.filter(e => e.event_type === 'survey_shown').length;
    const currentCompleted = currentAnswered.length;
    const currentDismissed = current.filter(e => e.event_type === 'survey_dismissed').length;
    const completionRate = currentShown > 0 
      ? Math.round((currentCompleted / currentShown) * 100)
      : 0;

    const prevShown = previous.filter(e => e.event_type === 'survey_shown').length;
    const prevCompleted = prevAnswered.length;

    // Friction points breakdown
    const frictionCounts: Record<string, number> = {};
    currentAnswered.forEach(e => {
      if (e.friction_tags && Array.isArray(e.friction_tags)) {
        e.friction_tags.forEach(tag => {
          frictionCounts[tag] = (frictionCounts[tag] || 0) + 1;
        });
      }
    });

    const topFrictionPoints = Object.entries(frictionCounts)
      .map(([key, count]) => ({
        label: FRICTION_LABELS[key] || key,
        count,
        percentage: currentAnswered.length > 0 
          ? Math.round((count / currentAnswered.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Goal breakdown
    const goalCounts: Record<string, number> = {};
    currentAnswered.forEach(e => {
      if (e.goal_type) {
        goalCounts[e.goal_type] = (goalCounts[e.goal_type] || 0) + 1;
      }
    });

    const goalBreakdown = Object.entries(goalCounts)
      .map(([key, count]) => ({
        label: GOAL_LABELS[key] || key,
        count,
        percentage: currentAnswered.length > 0
          ? Math.round((count / currentAnswered.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    currentAnswered.forEach(e => {
      if (e.device_type) {
        deviceCounts[e.device_type] = (deviceCounts[e.device_type] || 0) + 1;
      }
    });

    // Format date range
    const dateRangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Build email HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
    .stat-change { font-size: 12px; margin-top: 4px; }
    .stat-change.positive { color: #10b981; }
    .stat-change.negative { color: #ef4444; }
    .stat-change.neutral { color: #6b7280; }
    .nps-card { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center; }
    .nps-score { font-size: 48px; font-weight: bold; color: #166534; }
    .nps-label { font-size: 14px; color: #15803d; margin-top: 4px; }
    .nps-breakdown { display: flex; justify-content: center; gap: 24px; margin-top: 16px; }
    .nps-item { text-align: center; }
    .nps-item-value { font-size: 20px; font-weight: 600; }
    .nps-item-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .promoter { color: #22c55e; }
    .passive { color: #eab308; }
    .detractor { color: #ef4444; }
    .section { margin-top: 24px; }
    .section-title { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .section-icon { font-size: 18px; }
    .list-card { background: #f9fafb; border-radius: 8px; overflow: hidden; }
    .list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
    .list-item:last-child { border-bottom: none; }
    .list-item-label { font-size: 14px; color: #374151; }
    .list-item-value { font-size: 14px; font-weight: 600; color: #6366f1; }
    .list-item-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-top: 8px; }
    .list-item-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; }
    .empty-state { text-align: center; padding: 24px; color: #6b7280; font-style: italic; }
    .footer { background: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 12px; }
    .footer a { color: #6366f1; text-decoration: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
    .badge-pulse { background: #ddd6fe; color: #5b21b6; }
    .badge-experience { background: #cffafe; color: #0e7490; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Survey Digest</h1>
      <p>${dateRangeLabel}</p>
    </div>
    <div class="content">
      ${npsScore !== null ? `
      <div class="nps-card">
        <div class="nps-score">${npsScore > 0 ? '+' : ''}${npsScore}</div>
        <div class="nps-label">Net Promoter Score</div>
        <div class="nps-breakdown">
          <div class="nps-item">
            <div class="nps-item-value promoter">${promoters}</div>
            <div class="nps-item-label">Promoters</div>
          </div>
          <div class="nps-item">
            <div class="nps-item-value passive">${passives}</div>
            <div class="nps-item-label">Passives</div>
          </div>
          <div class="nps-item">
            <div class="nps-item-value detractor">${detractors}</div>
            <div class="nps-item-label">Detractors</div>
          </div>
        </div>
      </div>
      ` : `
      <div class="nps-card" style="background: #f9fafb; border-color: #e5e7eb;">
        <div class="nps-score" style="color: #6b7280; font-size: 24px;">No NPS Data</div>
        <div class="nps-label" style="color: #9ca3af;">No responses with NPS scores this week</div>
      </div>
      `}
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${currentCompleted}</div>
          <div class="stat-label">Responses</div>
          <div class="stat-change ${currentCompleted >= prevCompleted ? 'positive' : 'negative'}">
            ${formatChangeIndicator(currentCompleted, prevCompleted)} vs last week
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${completionRate}%</div>
          <div class="stat-label">Completion Rate</div>
          <div class="stat-change neutral">${currentShown} shown, ${currentDismissed} dismissed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgNps !== null ? avgNps.toFixed(1) : '—'}</div>
          <div class="stat-label">Avg NPS Score</div>
          ${prevAvgNps !== null && avgNps !== null ? `
          <div class="stat-change ${avgNps >= prevAvgNps ? 'positive' : 'negative'}">
            ${avgNps >= prevAvgNps ? '↑' : '↓'} ${Math.abs(Math.round((avgNps - prevAvgNps) * 10) / 10)} pts
          </div>
          ` : '<div class="stat-change neutral">—</div>'}
        </div>
        <div class="stat-card">
          <div class="stat-value">${Object.entries(deviceCounts).length}</div>
          <div class="stat-label">Device Types</div>
          <div class="stat-change neutral">
            ${Object.entries(deviceCounts).map(([d, c]) => `${d}: ${c}`).join(', ') || '—'}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">⚠️</span>
          Top Friction Points
        </div>
        <div class="list-card">
          ${topFrictionPoints.length > 0 ? topFrictionPoints.map(fp => `
          <div class="list-item">
            <div style="flex: 1;">
              <div class="list-item-label">${fp.label}</div>
              <div class="list-item-bar">
                <div class="list-item-bar-fill" style="width: ${fp.percentage}%;"></div>
              </div>
            </div>
            <div class="list-item-value">${fp.count} (${fp.percentage}%)</div>
          </div>
          `).join('') : `
          <div class="empty-state">No friction points reported this week</div>
          `}
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <span class="section-icon">🎯</span>
          User Goals
        </div>
        <div class="list-card">
          ${goalBreakdown.length > 0 ? goalBreakdown.map(g => `
          <div class="list-item">
            <div class="list-item-label">${g.label}</div>
            <div class="list-item-value">${g.count} (${g.percentage}%)</div>
          </div>
          `).join('') : `
          <div class="empty-state">No goal data collected this week</div>
          `}
        </div>
      </div>

      ${currentAnswered.length > 0 ? `
      <div class="section">
        <div class="section-title">
          <span class="section-icon">📝</span>
          Survey Types
        </div>
        <div class="list-card">
          <div class="list-item">
            <div class="list-item-label">
              <span class="badge badge-pulse">Pulse</span>
              Quick feedback
            </div>
            <div class="list-item-value">
              ${currentAnswered.filter(e => e.survey_id?.includes('pulse')).length}
            </div>
          </div>
          <div class="list-item">
            <div class="list-item-label">
              <span class="badge badge-experience">Experience</span>
              Comprehensive
            </div>
            <div class="list-item-value">
              ${currentAnswered.filter(e => e.survey_id?.includes('experience')).length}
            </div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This digest was automatically generated by PitchPerfect</p>
      <p>View full analytics at <a href="#">your dashboard</a></p>
      <p style="margin-top: 12px; font-size: 11px;">
        To unsubscribe, update your preferences in Settings
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to all recipients
    const emailResponse = await resend.emails.send({
      from: 'PitchPerfect <onboarding@resend.dev>',
      to: recipients,
      subject: `📊 Weekly Survey Digest - ${dateRangeLabel}`,
      html,
    });

    console.log('Survey digest sent successfully:', {
      recipients: recipients.length,
      responses: currentCompleted,
      npsScore,
      emailResponse,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Digest sent to ${recipients.length} recipients`,
        stats: {
          responses: currentCompleted,
          npsScore,
          completionRate,
          topFrictionPoints: topFrictionPoints.slice(0, 3).map(f => f.label),
        },
        emailResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending survey digest:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
