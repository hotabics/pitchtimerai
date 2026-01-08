-- Create table for shared scripts
CREATE TABLE public.shared_scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  idea text NOT NULL,
  track text NOT NULL,
  audience_label text,
  speech_blocks jsonb NOT NULL,
  total_words integer,
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE public.shared_scripts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared scripts (they're meant to be public)
CREATE POLICY "Anyone can read shared scripts"
ON public.shared_scripts
FOR SELECT
USING (true);

-- Allow anyone to create shared scripts
CREATE POLICY "Anyone can create shared scripts"
ON public.shared_scripts
FOR INSERT
WITH CHECK (true);