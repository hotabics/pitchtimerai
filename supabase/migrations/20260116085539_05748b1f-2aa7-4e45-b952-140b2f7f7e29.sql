-- Fix security issues by tightening RLS policies

-- 1. Fix challenge_participants - restrict email visibility to authenticated users
DROP POLICY IF EXISTS "Anyone can view participants" ON public.challenge_participants;
CREATE POLICY "Authenticated users can view participants" 
ON public.challenge_participants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 2. Fix pitch_challenges - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.pitch_challenges;
CREATE POLICY "Authenticated users can view challenges" 
ON public.pitch_challenges 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Fix practice_sessions - require auth for viewing
DROP POLICY IF EXISTS "Users can view own sessions and shared sessions" ON public.practice_sessions;
CREATE POLICY "Authenticated users can view own sessions" 
ON public.practice_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Fix interrogation_sessions - require authentication
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.interrogation_sessions;
CREATE POLICY "Authenticated users can view own sessions" 
ON public.interrogation_sessions 
FOR SELECT 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Also fix insert policy
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.interrogation_sessions;
CREATE POLICY "Authenticated users can insert sessions" 
ON public.interrogation_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Fix update policy
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.interrogation_sessions;
CREATE POLICY "Authenticated users can update own sessions" 
ON public.interrogation_sessions 
FOR UPDATE 
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Fix survey_events - restrict to service role / admins only (remove public select)
DROP POLICY IF EXISTS "Anyone can insert survey events" ON public.survey_events;
DROP POLICY IF EXISTS "Anyone can view survey events" ON public.survey_events;
DROP POLICY IF EXISTS "Service role can view survey events" ON public.survey_events;

-- Only service role can read survey events (USING false blocks client, service role bypasses RLS)
CREATE POLICY "Service role only can view survey events" 
ON public.survey_events 
FOR SELECT 
USING (false);

-- Allow inserts for analytics tracking
CREATE POLICY "Anyone can insert survey events" 
ON public.survey_events 
FOR INSERT 
WITH CHECK (true);