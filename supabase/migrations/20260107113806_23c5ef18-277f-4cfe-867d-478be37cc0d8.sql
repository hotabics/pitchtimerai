-- Add jury_questions_json column for storing AI-generated hackathon jury questions
ALTER TABLE public.practice_sessions 
ADD COLUMN jury_questions_json jsonb DEFAULT NULL;