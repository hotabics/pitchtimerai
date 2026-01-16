-- Clean up conflicting and overly-permissive policies

-- 1. Remove old permissive policies on challenge_participants
DROP POLICY IF EXISTS "Allow inserting challenge participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "Participants can update their scores" ON public.challenge_participants;
DROP POLICY IF EXISTS "Allow viewing challenge participants" ON public.challenge_participants;

-- 2. Remove old permissive policies on pitch_challenges
DROP POLICY IF EXISTS "Creator can update their challenges" ON public.pitch_challenges;
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.pitch_challenges;

-- 3. Remove conflicting policies on feedback_logs
DROP POLICY IF EXISTS "Allow public reads for analytics" ON public.feedback_logs;
DROP POLICY IF EXISTS "Allow feedback updates" ON public.feedback_logs;

-- 4. Remove conflicting policies on survey_events
DROP POLICY IF EXISTS "Allow reading survey events for analytics" ON public.survey_events;

-- 5. Fix interrogation_sessions to strictly require auth (remove any null user_id access)
DROP POLICY IF EXISTS "Users can view sessions with null user_id" ON public.interrogation_sessions;
DROP POLICY IF EXISTS "Allow anonymous access to interrogation sessions" ON public.interrogation_sessions;

-- Add policy for challenge participants to only see own email (not others)
DROP POLICY IF EXISTS "Users can view own participations" ON public.challenge_participants;
CREATE POLICY "View own participation only" 
ON public.challenge_participants 
FOR SELECT 
USING (auth.email() = participant_email);

-- Re-add INSERT policies for challenge_participants (needed for joining)
CREATE POLICY "Auth users can join challenges" 
ON public.challenge_participants 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.email() = participant_email);