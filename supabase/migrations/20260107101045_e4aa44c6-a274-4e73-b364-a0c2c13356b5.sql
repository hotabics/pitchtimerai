-- Add columns for hackathon jury evaluation events
ALTER TABLE public.practice_sessions 
ADD COLUMN IF NOT EXISTS events_json jsonb,
ADD COLUMN IF NOT EXISTS primary_issue_key text,
ADD COLUMN IF NOT EXISTS primary_issue_json jsonb;