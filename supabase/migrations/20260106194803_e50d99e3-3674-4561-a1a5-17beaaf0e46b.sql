-- Add entry_mode and structured_script columns to practice_sessions
ALTER TABLE public.practice_sessions
ADD COLUMN IF NOT EXISTS entry_mode text DEFAULT 'generate' CHECK (entry_mode IN ('generate', 'custom_script')),
ADD COLUMN IF NOT EXISTS original_script_text text,
ADD COLUMN IF NOT EXISTS structured_script_json jsonb;