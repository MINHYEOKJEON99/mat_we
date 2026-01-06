-- Create storage bucket for community post media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,
  52428800, -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload community media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'community-media');

-- Allow public read access
CREATE POLICY "Public can view community media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own community media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);
