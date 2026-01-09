-- Create challenges table
CREATE TABLE public.pitch_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  creator_email TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  track TEXT NOT NULL DEFAULT 'hackathon-jury',
  target_score INTEGER DEFAULT 70,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge participants table
CREATE TABLE public.challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.pitch_challenges(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  best_score INTEGER DEFAULT 0,
  total_pitches INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_pitch_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, participant_name)
);

-- Enable RLS
ALTER TABLE public.pitch_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenges
CREATE POLICY "Anyone can view active challenges"
ON public.pitch_challenges FOR SELECT
USING (true);

CREATE POLICY "Anyone can create challenges"
ON public.pitch_challenges FOR INSERT
WITH CHECK (true);

CREATE POLICY "Creator can update their challenges"
ON public.pitch_challenges FOR UPDATE
USING (true);

-- RLS policies for participants
CREATE POLICY "Anyone can view participants"
ON public.challenge_participants FOR SELECT
USING (true);

CREATE POLICY "Anyone can join challenges"
ON public.challenge_participants FOR INSERT
WITH CHECK (true);

CREATE POLICY "Participants can update their scores"
ON public.challenge_participants FOR UPDATE
USING (true);

-- Create index for invite code lookups
CREATE INDEX idx_challenges_invite_code ON public.pitch_challenges(invite_code);
CREATE INDEX idx_participants_challenge_id ON public.challenge_participants(challenge_id);