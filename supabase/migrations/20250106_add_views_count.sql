-- Add views_count column to community_posts table
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create index for performance on views_count
CREATE INDEX IF NOT EXISTS idx_community_posts_views ON public.community_posts(views_count DESC);

-- Create index for created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);

-- Create RPC function to increment views atomically
CREATE OR REPLACE FUNCTION increment_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.community_posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
