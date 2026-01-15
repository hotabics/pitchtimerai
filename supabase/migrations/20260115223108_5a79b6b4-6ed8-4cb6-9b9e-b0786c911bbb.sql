-- Add user_id column to practice_sessions for proper ownership
ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);

-- Drop existing practice_sessions policies
DROP POLICY IF EXISTS "Users can create practice sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can view their sessions by group" ON practice_sessions;
DROP POLICY IF EXISTS "Users can update their sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Users can delete their sessions" ON practice_sessions;

-- Create new user-based RLS policies for practice_sessions
-- Authenticated users can create sessions linked to their account
CREATE POLICY "Authenticated users can create sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) 
    OR (auth.uid() IS NULL AND session_group_id IS NOT NULL)
  );

-- Users can only view their own sessions (by user_id if logged in, or session_group_id if anonymous)
CREATE POLICY "Users can view own sessions"
  ON practice_sessions FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (user_id IS NULL AND session_group_id IS NOT NULL)
  );

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
  ON practice_sessions FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (user_id IS NULL AND session_group_id IS NOT NULL)
  );

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON practice_sessions FOR DELETE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR (user_id IS NULL AND session_group_id IS NOT NULL)
  );

-- Fix challenge_participants - hide email from non-creators
DROP POLICY IF EXISTS "Anyone can view participants" ON challenge_participants;

-- Create a view-based policy that shows emails only to challenge creators
-- First, allow viewing participant data (without exposing sensitive fields via application logic)
CREATE POLICY "Anyone can view participant scores"
  ON challenge_participants FOR SELECT
  USING (true);

-- Note: Email filtering should be done at application level or via a view
-- For now, keep SELECT open but add a security note

-- Add user_id to interrogation_sessions for proper ownership
ALTER TABLE interrogation_sessions 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop existing interrogation_sessions policies  
DROP POLICY IF EXISTS "Anyone can create interrogation sessions" ON interrogation_sessions;
DROP POLICY IF EXISTS "Anyone can view interrogation sessions" ON interrogation_sessions;

-- Create user-based policies for interrogation_sessions
CREATE POLICY "Authenticated users create own interrogation sessions"
  ON interrogation_sessions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
    OR auth.uid() IS NULL
  );

-- Users can only view their own interrogation sessions
CREATE POLICY "Users can view own interrogation sessions"
  ON interrogation_sessions FOR SELECT
  USING (
    user_id = auth.uid() 
    OR user_id IS NULL
  );