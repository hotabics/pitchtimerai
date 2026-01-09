-- Create analytics_subscribers table for managing email report subscriptions
CREATE TABLE public.analytics_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (admin-only feature)
CREATE POLICY "Allow all operations on analytics_subscribers" 
ON public.analytics_subscribers 
FOR ALL 
USING (true) 
WITH CHECK (true);