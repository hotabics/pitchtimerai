-- Create feedback_logs table for RLHF data
CREATE TABLE public.feedback_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  feedback_type TEXT NOT NULL,
  session_id TEXT,
  script_id TEXT,
  metric_name TEXT,
  reason TEXT,
  is_new_version_better BOOLEAN,
  additional_context JSONB,
  undone BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.feedback_logs ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anonymous feedback)
CREATE POLICY "Allow anonymous feedback inserts"
ON public.feedback_logs
FOR INSERT
WITH CHECK (true);

-- Allow public reads for analytics
CREATE POLICY "Allow public reads for analytics"
ON public.feedback_logs
FOR SELECT
USING (true);

-- Allow updates for undo functionality
CREATE POLICY "Allow feedback updates"
ON public.feedback_logs
FOR UPDATE
USING (true);

-- Create index for analytics queries
CREATE INDEX idx_feedback_logs_type ON public.feedback_logs(feedback_type);
CREATE INDEX idx_feedback_logs_created_at ON public.feedback_logs(created_at);