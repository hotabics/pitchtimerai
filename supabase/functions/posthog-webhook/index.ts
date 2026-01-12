/**
 * PostHog Webhook Handler
 * 
 * Receives survey events from PostHog and stores them in Supabase
 * for persistent analytics storage.
 * 
 * Webhook URL: https://ryjvwimnteinqaxpmkfk.supabase.co/functions/v1/posthog-webhook
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostHogEvent {
  event: string;
  distinct_id?: string;
  properties?: {
    survey_id?: string;
    answers?: Record<string, unknown>;
    nps_score?: number;
    friction_tags?: string[];
    goal_type?: string;
    device_type?: string;
    trigger?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
  timestamp?: string;
}

interface PostHogWebhookPayload {
  event?: PostHogEvent;
  batch?: PostHogEvent[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload: PostHogWebhookPayload = await req.json();
    console.log('Received PostHog webhook payload:', JSON.stringify(payload).slice(0, 500));

    // Handle both single event and batch formats
    const events: PostHogEvent[] = [];
    
    if (payload.event) {
      events.push(payload.event);
    }
    
    if (payload.batch && Array.isArray(payload.batch)) {
      events.push(...payload.batch);
    }

    // Filter for survey-related events only
    const surveyEvents = events.filter(e => 
      ['survey_shown', 'survey_answered', 'survey_dismissed'].includes(e.event)
    );

    if (surveyEvents.length === 0) {
      console.log('No survey events in payload, skipping');
      return new Response(
        JSON.stringify({ success: true, message: 'No survey events to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${surveyEvents.length} survey events`);

    // Transform and insert events
    const eventsToInsert = surveyEvents.map(event => ({
      event_type: event.event,
      survey_id: event.properties?.survey_id || 'unknown',
      answers: event.properties?.answers || null,
      nps_score: event.properties?.nps_score || null,
      friction_tags: event.properties?.friction_tags || null,
      goal_type: event.properties?.goal_type || null,
      device_type: event.properties?.device_type || null,
      trigger: event.properties?.trigger || null,
      distinct_id: event.distinct_id || null,
      event_timestamp: event.properties?.timestamp || event.timestamp || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('survey_events')
      .insert(eventsToInsert)
      .select('id');

    if (error) {
      console.error('Failed to insert survey events:', error);
      throw error;
    }

    console.log(`Successfully inserted ${data?.length || 0} survey events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${data?.length || 0} survey events`,
        ids: data?.map(d => d.id) 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
