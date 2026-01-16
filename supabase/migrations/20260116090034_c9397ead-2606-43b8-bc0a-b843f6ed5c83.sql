-- Remove remaining problematic policies

-- 1. Remove the "Anyone can view participant scores" policy that exposes emails
DROP POLICY IF EXISTS "Anyone can view participant scores" ON public.challenge_participants;

-- 2. Delete the anonymous interrogation session that exposes data
DELETE FROM public.interrogation_sessions WHERE user_id IS NULL;

-- Make sure interrogation sessions require authentication
DROP POLICY IF EXISTS "Authenticated users view own sessions" ON public.interrogation_sessions;
CREATE POLICY "Auth users view own sessions only" 
ON public.interrogation_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);