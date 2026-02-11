-- Add video_url column to course_videos table for direct video uploads
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update storage bucket limit for larger video files (500MB)
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'community-media';
