-- Interview Simulations table for "The First Round" feature
CREATE TABLE public.interview_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Job data
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description TEXT NOT NULL,
  job_url TEXT,
  job_requirements JSONB DEFAULT '[]'::jsonb,
  
  -- CV data  
  cv_content TEXT NOT NULL,
  cv_parsed JSONB DEFAULT '{}'::jsonb,
  
  -- Match analysis
  match_strengths JSONB DEFAULT '[]'::jsonb,
  match_gaps JSONB DEFAULT '[]'::jsonb,
  key_evidence JSONB DEFAULT '[]'::jsonb,
  
  -- Simulation state
  status TEXT NOT NULL DEFAULT 'setup',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Scoring
  hireability_score INTEGER,
  category_scores JSONB DEFAULT '{}'::jsonb,
  strategic_reframes JSONB DEFAULT '[]'::jsonb,
  verdict_summary TEXT,
  conversion_likelihood TEXT,
  
  -- Additional metadata
  interviewer_persona TEXT DEFAULT 'professional'
);

-- Interview turns table
CREATE TABLE public.interview_simulation_turns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.interview_simulations(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- AI analysis of user response
  intent TEXT,
  strategic_score INTEGER,
  missed_opportunities JSONB DEFAULT '[]'::jsonb,
  suggested_reframe TEXT,
  evidence_used JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.interview_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_simulation_turns ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_simulations
CREATE POLICY "Users can view their own interview simulations" 
ON public.interview_simulations 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
);

CREATE POLICY "Users can create interview simulations" 
ON public.interview_simulations 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR user_id IS NULL
);

CREATE POLICY "Users can update their own interview simulations" 
ON public.interview_simulations 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
);

CREATE POLICY "Users can delete their own interview simulations" 
ON public.interview_simulations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for interview_simulation_turns
CREATE POLICY "Users can view turns for their simulations" 
ON public.interview_simulation_turns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.interview_simulations 
    WHERE id = simulation_id 
    AND (auth.uid() = user_id OR user_id IS NULL)
  )
);

CREATE POLICY "Users can insert turns for their simulations" 
ON public.interview_simulation_turns 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.interview_simulations 
    WHERE id = simulation_id 
    AND (auth.uid() = user_id OR user_id IS NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_interview_simulations_user_id ON public.interview_simulations(user_id);
CREATE INDEX idx_interview_simulations_status ON public.interview_simulations(status);
CREATE INDEX idx_interview_simulation_turns_simulation_id ON public.interview_simulation_turns(simulation_id);

-- Add trigger for updated_at
CREATE TRIGGER update_interview_simulations_updated_at
BEFORE UPDATE ON public.interview_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();