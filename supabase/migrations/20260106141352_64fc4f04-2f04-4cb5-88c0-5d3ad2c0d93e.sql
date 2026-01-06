-- Create table for tracking AI suggestion analytics
CREATE TABLE public.suggestion_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_type TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow anonymous inserts for analytics
ALTER TABLE public.suggestion_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics (public tracking)
CREATE POLICY "Allow anonymous analytics inserts" 
ON public.suggestion_analytics 
FOR INSERT 
WITH CHECK (true);

-- Only allow reading for admin purposes (no public reads)
CREATE POLICY "No public reads" 
ON public.suggestion_analytics 
FOR SELECT 
USING (false);