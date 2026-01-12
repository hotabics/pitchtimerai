-- Create table for storing survey events from PostHog webhook
CREATE TABLE public.survey_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  survey_id TEXT NOT NULL,
  answers JSONB,
  nps_score INTEGER,
  friction_tags TEXT[],
  goal_type TEXT,
  device_type TEXT,
  trigger TEXT,
  distinct_id TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_survey_events_survey_id ON public.survey_events(survey_id);
CREATE INDEX idx_survey_events_event_type ON public.survey_events(event_type);
CREATE INDEX idx_survey_events_created_at ON public.survey_events(created_at DESC);
CREATE INDEX idx_survey_events_nps_score ON public.survey_events(nps_score) WHERE nps_score IS NOT NULL;

-- Enable RLS
ALTER TABLE public.survey_events ENABLE ROW LEVEL SECURITY;

-- Create policy for webhook insert (service role) - no auth required for webhook
CREATE POLICY "Allow webhook inserts" 
ON public.survey_events 
FOR INSERT 
WITH CHECK (true);

-- Create policy for reading survey events (for analytics dashboard, allow all for now since anonymous)
CREATE POLICY "Allow reading survey events for analytics" 
ON public.survey_events 
FOR SELECT 
USING (true);