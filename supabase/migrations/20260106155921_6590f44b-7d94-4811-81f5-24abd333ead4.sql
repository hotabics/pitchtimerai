-- Create table for storing practice session recordings and analysis
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  idea TEXT NOT NULL,
  track TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  recording_duration_seconds INTEGER NOT NULL,
  
  -- Analysis results
  score INTEGER NOT NULL DEFAULT 0,
  wpm INTEGER NOT NULL DEFAULT 0,
  filler_count INTEGER NOT NULL DEFAULT 0,
  filler_breakdown JSONB DEFAULT '{"ums": 0, "likes": 0, "basically": 0}'::jsonb,
  tone TEXT,
  missed_sections TEXT[] DEFAULT '{}',
  
  -- Transcription data
  transcription TEXT,
  transcription_html TEXT,
  
  -- Feedback
  feedback TEXT[] DEFAULT '{}',
  
  -- Reference to original script (for comparison)
  original_script TEXT,
  
  -- Session identifier for grouping sessions by project
  session_group_id TEXT
);

-- Enable Row Level Security (public table for now - no auth required)
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no auth in this app)
CREATE POLICY "Allow all operations on practice_sessions" 
ON public.practice_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for faster querying by session group
CREATE INDEX idx_practice_sessions_group ON public.practice_sessions(session_group_id);
CREATE INDEX idx_practice_sessions_created ON public.practice_sessions(created_at DESC);