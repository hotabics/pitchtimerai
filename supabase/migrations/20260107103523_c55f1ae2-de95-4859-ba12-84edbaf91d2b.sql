-- Add fields for retry/improvement tracking
ALTER TABLE public.practice_sessions
ADD COLUMN baseline_session_id uuid REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
ADD COLUMN improvement_summary_json jsonb;

-- Add index for faster baseline lookups
CREATE INDEX idx_practice_sessions_baseline ON public.practice_sessions(baseline_session_id) WHERE baseline_session_id IS NOT NULL;