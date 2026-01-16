-- Fix remaining error-level security issues (with correct types)

-- 1. challenge_participants: Only allow viewing own participation
DROP POLICY IF EXISTS "Authenticated users can view participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can view their own participations" ON public.challenge_participants;
CREATE POLICY "Users can view own participations" 
ON public.challenge_participants 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND participant_email = auth.email()
);

-- Fix UPDATE policy - only own records
DROP POLICY IF EXISTS "Anyone can update participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.challenge_participants;
CREATE POLICY "Users can update own participation only" 
ON public.challenge_participants 
FOR UPDATE 
USING (participant_email = auth.email());

-- 2. pitch_challenges: Only show to creators (created_by is text storing email)
DROP POLICY IF EXISTS "Authenticated users can view challenges" ON public.pitch_challenges;
DROP POLICY IF EXISTS "Challenge creators can view their challenges" ON public.pitch_challenges;
CREATE POLICY "Creators can view own challenges" 
ON public.pitch_challenges 
FOR SELECT 
USING (auth.email() = creator_email);

-- Fix UPDATE policy - only creators can update
DROP POLICY IF EXISTS "Anyone can update challenges" ON public.pitch_challenges;
DROP POLICY IF EXISTS "Creators can update own challenges" ON public.pitch_challenges;
CREATE POLICY "Creators can update their challenges" 
ON public.pitch_challenges 
FOR UPDATE 
USING (auth.email() = creator_email);

-- 3. practice_sessions: Require strict authentication
DROP POLICY IF EXISTS "Authenticated users can view own sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Auth users can view own sessions" ON public.practice_sessions;
CREATE POLICY "Authenticated users view own sessions" 
ON public.practice_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. interrogation_sessions: Strict auth only  
DROP POLICY IF EXISTS "Authenticated users can view own sessions" ON public.interrogation_sessions;
DROP POLICY IF EXISTS "Strict auth for viewing sessions" ON public.interrogation_sessions;
CREATE POLICY "Authenticated users view own sessions" 
ON public.interrogation_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 5. feedback_logs: Restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback_logs;
DROP POLICY IF EXISTS "Anyone can read feedback logs" ON public.feedback_logs;
DROP POLICY IF EXISTS "Authenticated users can view feedback" ON public.feedback_logs;
CREATE POLICY "Auth users can view feedback" 
ON public.feedback_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Restrict UPDATE on feedback_logs
DROP POLICY IF EXISTS "Anyone can update feedback" ON public.feedback_logs;
DROP POLICY IF EXISTS "No updates to feedback logs" ON public.feedback_logs;
CREATE POLICY "Block updates to feedback logs" 
ON public.feedback_logs 
FOR UPDATE 
USING (false);