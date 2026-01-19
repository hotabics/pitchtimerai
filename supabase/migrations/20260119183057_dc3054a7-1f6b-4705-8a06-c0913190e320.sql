-- Create sales_simulations table to store call sessions
CREATE TABLE public.sales_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Setup configuration
  industry TEXT NOT NULL,
  product_description TEXT NOT NULL,
  client_role TEXT NOT NULL,
  client_personality TEXT NOT NULL DEFAULT 'neutral',
  objection_level TEXT NOT NULL DEFAULT 'medium',
  call_goal TEXT NOT NULL DEFAULT 'book_demo',
  custom_goal TEXT,
  
  -- Call state
  status TEXT NOT NULL DEFAULT 'setup',
  call_stage TEXT DEFAULT 'opening',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  
  -- AI client state
  client_interest_level INTEGER DEFAULT 5,
  client_trust_level INTEGER DEFAULT 5,
  client_urgency_level INTEGER DEFAULT 3,
  client_signals JSONB DEFAULT '[]'::jsonb,
  
  -- Metrics
  talk_ratio DECIMAL(5,2) DEFAULT 0.50,
  question_count INTEGER DEFAULT 0,
  objections_raised INTEGER DEFAULT 0,
  objections_handled INTEGER DEFAULT 0,
  coach_suggestions_shown INTEGER DEFAULT 0,
  coach_suggestions_followed INTEGER DEFAULT 0,
  
  -- Scores (0-100 scale)
  opening_score INTEGER,
  discovery_score INTEGER,
  value_score INTEGER,
  objection_score INTEGER,
  close_score INTEGER,
  overall_score INTEGER,
  penalties JSONB DEFAULT '{}'::jsonb,
  
  -- Analysis
  highlights JSONB DEFAULT '[]'::jsonb,
  improvements JSONB DEFAULT '[]'::jsonb,
  timeline_events JSONB DEFAULT '[]'::jsonb,
  conversion_likelihood TEXT
);

-- Create sales_simulation_turns table to store conversation turns
CREATE TABLE public.sales_simulation_turns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID NOT NULL REFERENCES public.sales_simulations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Turn data
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'client'
  content TEXT NOT NULL,
  
  -- Timing
  start_time_seconds DECIMAL(10,2),
  end_time_seconds DECIMAL(10,2),
  duration_seconds DECIMAL(10,2),
  
  -- Client AI state (only for client turns)
  intent TEXT,
  state_update JSONB,
  objection JSONB,
  
  -- Coach suggestions (only for user turns)
  coach_tips JSONB DEFAULT '[]'::jsonb,
  coach_next_action JSONB,
  coach_red_flags JSONB DEFAULT '[]'::jsonb,
  coach_stage_recommendation TEXT,
  
  -- Analysis flags
  is_question BOOLEAN DEFAULT false,
  is_objection_response BOOLEAN DEFAULT false,
  word_count INTEGER DEFAULT 0
);

-- Create sales_scripts table for script coach feature
CREATE TABLE public.sales_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  title TEXT NOT NULL DEFAULT 'Untitled Script',
  original_content TEXT NOT NULL,
  improved_content TEXT,
  
  -- AI feedback
  feedback_items JSONB DEFAULT '[]'::jsonb,
  overall_assessment TEXT,
  
  -- Metadata
  industry TEXT,
  call_goal TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.sales_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_simulation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_scripts ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_simulations
CREATE POLICY "Users can view own simulations"
  ON public.sales_simulations
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create simulations"
  ON public.sales_simulations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

CREATE POLICY "Users can update own simulations"
  ON public.sales_simulations
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own simulations"
  ON public.sales_simulations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for sales_simulation_turns
CREATE POLICY "Users can view turns of own simulations"
  ON public.sales_simulation_turns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_simulations
      WHERE id = simulation_id AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can create turns for own simulations"
  ON public.sales_simulation_turns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_simulations
      WHERE id = simulation_id AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "Users can update turns of own simulations"
  ON public.sales_simulation_turns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_simulations
      WHERE id = simulation_id AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- RLS policies for sales_scripts
CREATE POLICY "Users can view own scripts"
  ON public.sales_scripts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scripts"
  ON public.sales_scripts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON public.sales_scripts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON public.sales_scripts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_sales_simulations_user_id ON public.sales_simulations(user_id);
CREATE INDEX idx_sales_simulations_status ON public.sales_simulations(status);
CREATE INDEX idx_sales_simulations_created_at ON public.sales_simulations(created_at DESC);
CREATE INDEX idx_sales_simulation_turns_simulation_id ON public.sales_simulation_turns(simulation_id);
CREATE INDEX idx_sales_simulation_turns_turn_number ON public.sales_simulation_turns(simulation_id, turn_number);
CREATE INDEX idx_sales_scripts_user_id ON public.sales_scripts(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_sales_simulations_updated_at
  BEFORE UPDATE ON public.sales_simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_scripts_updated_at
  BEFORE UPDATE ON public.sales_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();