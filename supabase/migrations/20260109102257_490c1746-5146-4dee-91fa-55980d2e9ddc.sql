-- Create storage bucket for pitch recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-recordings',
  'pitch-recordings',
  false,
  2147483648, -- 2GB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'audio/webm', 'audio/mp4']
);

-- Allow authenticated users to upload their own recordings
CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pitch-recordings' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view their own recordings
CREATE POLICY "Users can view their own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pitch-recordings'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own recordings
CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pitch-recordings'
  AND auth.role() = 'authenticated'
);

-- Add video_url column to practice_sessions table to store recording references
ALTER TABLE public.practice_sessions
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- Add thumbnail_url column for video thumbnails
ALTER TABLE public.practice_sessions
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;