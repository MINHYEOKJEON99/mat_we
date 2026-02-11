-- Migration: Add course comments system
-- Students can leave comments on courses they are enrolled in

-- =====================================================
-- 1. COURSE COMMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.course_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_comments_course ON public.course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_student ON public.course_comments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_created ON public.course_comments(created_at DESC);

-- =====================================================
-- 2. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
DROP POLICY IF EXISTS "Anyone can view course comments" ON public.course_comments;
CREATE POLICY "Anyone can view course comments"
ON public.course_comments FOR SELECT
USING (true);

-- Students can create comments for enrolled courses
DROP POLICY IF EXISTS "Students can create comments for enrolled courses" ON public.course_comments;
CREATE POLICY "Students can create comments for enrolled courses"
ON public.course_comments FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = course_comments.course_id
    AND enrollments.student_id = auth.uid()
  )
);

-- Students can update their own comments
DROP POLICY IF EXISTS "Students can update their own comments" ON public.course_comments;
CREATE POLICY "Students can update their own comments"
ON public.course_comments FOR UPDATE
USING (student_id = auth.uid());

-- Students can delete their own comments
DROP POLICY IF EXISTS "Students can delete their own comments" ON public.course_comments;
CREATE POLICY "Students can delete their own comments"
ON public.course_comments FOR DELETE
USING (student_id = auth.uid());

-- =====================================================
-- 3. TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_course_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_course_comment_updated_at ON public.course_comments;
CREATE TRIGGER set_course_comment_updated_at
  BEFORE UPDATE ON public.course_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_course_comment_updated_at();
