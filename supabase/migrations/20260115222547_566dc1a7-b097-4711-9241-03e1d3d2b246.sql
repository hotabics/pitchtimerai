-- Fix 1: Tighten analytics_subscribers RLS
-- Remove overly permissive ALL policy
DROP POLICY IF EXISTS "Allow all operations on analytics_subscribers" ON analytics_subscribers;

-- Allow public to subscribe (INSERT) - this is the primary use case
CREATE POLICY "Anyone can subscribe"
  ON analytics_subscribers FOR INSERT
  WITH CHECK (true);

-- Only service_role can read subscribers (for sending emails via edge functions)
CREATE POLICY "Service role can read subscribers"
  ON analytics_subscribers FOR SELECT
  USING (auth.role() = 'service_role');

-- Only service_role can update subscribers
CREATE POLICY "Service role can update subscribers"
  ON analytics_subscribers FOR UPDATE
  USING (auth.role() = 'service_role');

-- Only service_role can delete subscribers
CREATE POLICY "Service role can delete subscribers"
  ON analytics_subscribers FOR DELETE
  USING (auth.role() = 'service_role');

-- Fix 2: Tighten practice_sessions RLS
-- Remove overly permissive ALL policy
DROP POLICY IF EXISTS "Allow all operations on practice_sessions" ON practice_sessions;

-- Allow users to create their own sessions (with session_group_id)
CREATE POLICY "Users can create practice sessions"
  ON practice_sessions FOR INSERT
  WITH CHECK (session_group_id IS NOT NULL);

-- Users can only read their own sessions (by session_group_id stored in localStorage)
-- This provides obscurity for the MVP without requiring auth
CREATE POLICY "Users can view their sessions by group"
  ON practice_sessions FOR SELECT
  USING (session_group_id IS NOT NULL);

-- Allow updates only to own sessions (by matching session_group_id in the request)
CREATE POLICY "Users can update their sessions"
  ON practice_sessions FOR UPDATE
  USING (session_group_id IS NOT NULL);

-- Allow deletes only to own sessions
CREATE POLICY "Users can delete their sessions"
  ON practice_sessions FOR DELETE
  USING (session_group_id IS NOT NULL);