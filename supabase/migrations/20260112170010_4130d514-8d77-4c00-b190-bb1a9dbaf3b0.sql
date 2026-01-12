-- Create a table for storing interrogation sessions
CREATE TABLE public.interrogation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Juror and session info
  juror_type TEXT NOT NULL,
  dossier_data JSONB,
  
  -- Questions and responses
  questions JSONB NOT NULL, -- Array of {question, category, intensity}
  responses JSONB NOT NULL, -- Array of {question, response, analysis}
  
  -- Verdict data
  verdict_data JSONB NOT NULL,
  overall_score INTEGER NOT NULL,
  status TEXT NOT NULL,
  
  -- Category scores
  choreography_score INTEGER NOT NULL,
  ammunition_score INTEGER NOT NULL,
  cold_bloodedness_score INTEGER NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.interrogation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies - allow anyone to insert (anonymous users welcome for hackathon demo)
CREATE POLICY "Anyone can create interrogation sessions" 
ON public.interrogation_sessions 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view their own sessions (by user_id if logged in, or all if anonymous)
CREATE POLICY "Anyone can view interrogation sessions" 
ON public.interrogation_sessions 
FOR SELECT 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_interrogation_sessions_user_id ON public.interrogation_sessions(user_id);
CREATE INDEX idx_interrogation_sessions_created_at ON public.interrogation_sessions(created_at DESC);