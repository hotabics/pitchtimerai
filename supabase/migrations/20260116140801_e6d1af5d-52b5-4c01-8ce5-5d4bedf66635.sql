-- Create saved_pitches table for persistent pitch scripts
CREATE TABLE public.saved_pitches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  idea TEXT NOT NULL,
  audience TEXT,
  audience_label TEXT,
  track TEXT NOT NULL,
  duration_minutes NUMERIC NOT NULL DEFAULT 3,
  speech_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta JSONB,
  hook_style TEXT,
  generation_mode TEXT DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_pitches ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_pitches
CREATE POLICY "Users can view own pitches"
ON public.saved_pitches
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pitches"
ON public.saved_pitches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pitches"
ON public.saved_pitches
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pitches"
ON public.saved_pitches
FOR DELETE
USING (auth.uid() = user_id);

-- Create coach_analysis table for AI Coach results
CREATE TABLE public.coach_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pitch_id UUID REFERENCES public.saved_pitches(id) ON DELETE SET NULL,
  overall_score INTEGER,
  transcript TEXT,
  delivery_metrics JSONB,
  content_analysis JSONB,
  recommendations JSONB,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  prompt_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_analysis
CREATE POLICY "Users can view own analysis"
ON public.coach_analysis
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analysis"
ON public.coach_analysis
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis"
ON public.coach_analysis
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis"
ON public.coach_analysis
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on saved_pitches
CREATE TRIGGER update_saved_pitches_updated_at
BEFORE UPDATE ON public.saved_pitches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_saved_pitches_user_id ON public.saved_pitches(user_id);
CREATE INDEX idx_saved_pitches_updated_at ON public.saved_pitches(updated_at DESC);
CREATE INDEX idx_coach_analysis_user_id ON public.coach_analysis(user_id);
CREATE INDEX idx_coach_analysis_pitch_id ON public.coach_analysis(pitch_id);
CREATE INDEX idx_coach_analysis_created_at ON public.coach_analysis(created_at DESC);