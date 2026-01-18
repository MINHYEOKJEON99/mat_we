-- Migration: Add categories and reviews system for courses
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CATEGORIES TABLE (3-level hierarchy)
-- Level 1: 종목 (Sport type: 주짓수, 레슬링, etc.)
-- Level 2: 포지션 (Position: 가드, 탑, 스탠딩, 밸런스)
-- Level 3: 테크닉 (Technique: 하프가드, 패스, 데라히바 가드, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,  -- Korean display name
  slug TEXT NOT NULL UNIQUE,  -- URL-friendly identifier
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1, 2, 3)),  -- 1=종목, 2=포지션, 3=테크닉
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,  -- Optional icon name or emoji
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON public.categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- =====================================================
-- 2. COURSE CATEGORIES JUNCTION TABLE (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_course_categories_course ON public.course_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_category ON public.course_categories(category_id);

-- =====================================================
-- 3. COURSE REVIEWS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,  -- Optional review text
  is_visible BOOLEAN DEFAULT true,  -- For moderation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)  -- One review per student per course
);

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_student ON public.course_reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON public.course_reviews(rating);

-- =====================================================
-- 4. UPDATE COURSES TABLE - Add computed fields
-- =====================================================

-- Add columns for cached rating stats (updated by trigger)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2, 1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS student_count INTEGER DEFAULT 0;

-- Index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_courses_average_rating ON public.courses(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_courses_student_count ON public.courses(student_count DESC);

-- =====================================================
-- 5. TRIGGERS FOR COMPUTED FIELDS
-- =====================================================

-- Function to update course rating stats
CREATE OR REPLACE FUNCTION public.update_course_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Determine which course_id to update
  IF TG_OP = 'DELETE' THEN
    v_course_id := OLD.course_id;
  ELSE
    v_course_id := NEW.course_id;
  END IF;

  -- Update the course's rating stats
  UPDATE public.courses
  SET
    average_rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.course_reviews
      WHERE course_id = v_course_id AND is_visible = true
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.course_reviews
      WHERE course_id = v_course_id AND is_visible = true
    ),
    updated_at = NOW()
  WHERE id = v_course_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for review changes
DROP TRIGGER IF EXISTS on_course_review_change ON public.course_reviews;
CREATE TRIGGER on_course_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_course_rating_stats();

-- Function to update course student count
CREATE OR REPLACE FUNCTION public.update_course_student_count()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Determine which course_id to update
  IF TG_OP = 'DELETE' THEN
    v_course_id := OLD.course_id;
  ELSE
    v_course_id := NEW.course_id;
  END IF;

  -- Update the course's student count
  UPDATE public.courses
  SET
    student_count = (
      SELECT COUNT(*)
      FROM public.enrollments
      WHERE course_id = v_course_id
    ),
    updated_at = NOW()
  WHERE id = v_course_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for enrollment changes
DROP TRIGGER IF EXISTS on_enrollment_change ON public.enrollments;
CREATE TRIGGER on_enrollment_change
  AFTER INSERT OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_course_student_count();

-- Trigger for updated_at on reviews
CREATE OR REPLACE FUNCTION public.update_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_review_updated_at ON public.course_reviews;
CREATE TRIGGER set_review_updated_at
  BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_review_updated_at();

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

-- Categories: Public read access
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

-- Only admins can manage categories (no INSERT/UPDATE/DELETE for regular users)
-- Categories will be managed via Supabase dashboard or admin interface

-- Course Categories: Public read, instructors manage
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Course categories are viewable by everyone" ON public.course_categories;
CREATE POLICY "Course categories are viewable by everyone"
ON public.course_categories FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Instructors can manage course categories" ON public.course_categories;
CREATE POLICY "Instructors can manage course categories"
ON public.course_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = course_categories.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Course Reviews: Public read visible reviews, students manage own
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible reviews are viewable by everyone" ON public.course_reviews;
CREATE POLICY "Visible reviews are viewable by everyone"
ON public.course_reviews FOR SELECT
USING (is_visible = true OR student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create reviews for enrolled courses" ON public.course_reviews;
CREATE POLICY "Students can create reviews for enrolled courses"
ON public.course_reviews FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = course_reviews.course_id
    AND enrollments.student_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can update their own reviews" ON public.course_reviews;
CREATE POLICY "Students can update their own reviews"
ON public.course_reviews FOR UPDATE
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can delete their own reviews" ON public.course_reviews;
CREATE POLICY "Students can delete their own reviews"
ON public.course_reviews FOR DELETE
USING (student_id = auth.uid());

-- =====================================================
-- 7. SEED DATA: BJJ CATEGORY HIERARCHY
-- =====================================================

-- Level 1: 종목 (Sport Types)
INSERT INTO public.categories (name, name_ko, slug, description, level, sort_order) VALUES
  ('jiujitsu', '주짓수', 'jiujitsu', '브라질리안 주짓수', 1, 1),
  ('wrestling', '레슬링', 'wrestling', '프리스타일 & 그레코로만', 1, 2),
  ('judo', '유도', 'judo', '일본 유도', 1, 3),
  ('mma', '종합격투기', 'mma', 'Mixed Martial Arts', 1, 4)
ON CONFLICT (slug) DO NOTHING;

-- Level 2: 포지션 (Positions) - 주짓수
INSERT INTO public.categories (name, name_ko, slug, description, parent_id, level, sort_order)
SELECT
  v.name, v.name_ko, v.slug, v.description,
  (SELECT id FROM public.categories WHERE slug = 'jiujitsu'),
  2, v.sort_order
FROM (VALUES
  ('guard', '가드', 'jiujitsu-guard', '가드 포지션 기술', 1),
  ('top', '탑', 'jiujitsu-top', '탑 포지션 기술', 2),
  ('standing', '스탠딩', 'jiujitsu-standing', '스탠딩 기술 (테이크다운)', 3),
  ('balance', '밸런스', 'jiujitsu-balance', '밸런스 및 무브먼트', 4)
) AS v(name, name_ko, slug, description, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Level 3: 테크닉 (Techniques) - 가드
INSERT INTO public.categories (name, name_ko, slug, description, parent_id, level, sort_order)
SELECT
  v.name, v.name_ko, v.slug, v.description,
  (SELECT id FROM public.categories WHERE slug = 'jiujitsu-guard'),
  3, v.sort_order
FROM (VALUES
  ('half-guard', '하프가드', 'jiujitsu-guard-half', '하프가드 기술', 1),
  ('de-la-riva', '데라히바 가드', 'jiujitsu-guard-dlr', '데라히바 가드 기술', 2),
  ('closed-guard', '클로즈드 가드', 'jiujitsu-guard-closed', '클로즈드 가드 기술', 3),
  ('open-guard', '오픈 가드', 'jiujitsu-guard-open', '오픈 가드 기술', 4),
  ('butterfly-guard', '버터플라이 가드', 'jiujitsu-guard-butterfly', '버터플라이 가드 기술', 5),
  ('spider-guard', '스파이더 가드', 'jiujitsu-guard-spider', '스파이더 가드 기술', 6),
  ('lasso-guard', '라쏘 가드', 'jiujitsu-guard-lasso', '라쏘 가드 기술', 7),
  ('x-guard', 'X 가드', 'jiujitsu-guard-x', 'X 가드 기술', 8)
) AS v(name, name_ko, slug, description, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Level 3: 테크닉 (Techniques) - 탑
INSERT INTO public.categories (name, name_ko, slug, description, parent_id, level, sort_order)
SELECT
  v.name, v.name_ko, v.slug, v.description,
  (SELECT id FROM public.categories WHERE slug = 'jiujitsu-top'),
  3, v.sort_order
FROM (VALUES
  ('pass', '패스', 'jiujitsu-top-pass', '가드 패스 기술', 1),
  ('mount', '마운트', 'jiujitsu-top-mount', '마운트 포지션', 2),
  ('side-control', '사이드 컨트롤', 'jiujitsu-top-side', '사이드 컨트롤 기술', 3),
  ('back-control', '백 컨트롤', 'jiujitsu-top-back', '백 컨트롤 기술', 4),
  ('knee-on-belly', '니 온 벨리', 'jiujitsu-top-kob', '니 온 벨리 기술', 5)
) AS v(name, name_ko, slug, description, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Level 3: 테크닉 (Techniques) - 스탠딩
INSERT INTO public.categories (name, name_ko, slug, description, parent_id, level, sort_order)
SELECT
  v.name, v.name_ko, v.slug, v.description,
  (SELECT id FROM public.categories WHERE slug = 'jiujitsu-standing'),
  3, v.sort_order
FROM (VALUES
  ('takedown', '테이크다운', 'jiujitsu-standing-takedown', '테이크다운 기술', 1),
  ('throw', '던지기', 'jiujitsu-standing-throw', '던지기 기술', 2),
  ('pull', '풀가드', 'jiujitsu-standing-pull', '가드 풀 기술', 3),
  ('clinch', '클린치', 'jiujitsu-standing-clinch', '클린치 기술', 4)
) AS v(name, name_ko, slug, description, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Level 3: 테크닉 (Techniques) - 밸런스
INSERT INTO public.categories (name, name_ko, slug, description, parent_id, level, sort_order)
SELECT
  v.name, v.name_ko, v.slug, v.description,
  (SELECT id FROM public.categories WHERE slug = 'jiujitsu-balance'),
  3, v.sort_order
FROM (VALUES
  ('hip-escape', '힙 이스케이프', 'jiujitsu-balance-hip', '힙 이스케이프 / 쉬림프', 1),
  ('bridge', '브릿지', 'jiujitsu-balance-bridge', '브릿지 기술', 2),
  ('roll', '롤', 'jiujitsu-balance-roll', '롤링 기술', 3),
  ('inversion', '인버전', 'jiujitsu-balance-inversion', '인버전 / 그랜비 롤', 4)
) AS v(name, name_ko, slug, description, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 8. SYNC EXISTING ENROLLMENTS TO STUDENT COUNT
-- =====================================================

-- Update student_count for all existing courses
UPDATE public.courses c
SET student_count = (
  SELECT COUNT(*)
  FROM public.enrollments e
  WHERE e.course_id = c.id
);
