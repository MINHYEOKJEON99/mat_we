-- =============================================
-- Role Enum 변환 및 강사 신청 기능 마이그레이션
-- =============================================

-- 1. role 컬럼을 사용하는 RLS 정책 임시 삭제
DROP POLICY IF EXISTS "Instructors can insert their own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can update their own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can delete their own courses" ON courses;
DROP POLICY IF EXISTS "Instructors can insert videos to their courses" ON course_videos;
DROP POLICY IF EXISTS "Instructors can update videos in their courses" ON course_videos;
DROP POLICY IF EXISTS "Instructors can delete videos from their courses" ON course_videos;

-- 2. user_role enum 타입 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'instructor');
    END IF;
END $$;

-- 3. profiles 테이블의 role 컬럼을 enum으로 변경
ALTER TABLE profiles
    ALTER COLUMN role DROP DEFAULT;

ALTER TABLE profiles
    ALTER COLUMN role TYPE user_role
    USING role::user_role;

ALTER TABLE profiles
    ALTER COLUMN role SET DEFAULT 'student'::user_role;

-- 4. RLS 정책 재생성 (enum 타입 사용 - text로 캐스팅하여 비교)
CREATE POLICY "Instructors can insert their own courses"
    ON courses FOR INSERT
    WITH CHECK (
        auth.uid() = instructor_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text = 'instructor'
        )
    );

CREATE POLICY "Instructors can update their own courses"
    ON courses FOR UPDATE
    USING (
        auth.uid() = instructor_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text = 'instructor'
        )
    );

CREATE POLICY "Instructors can delete their own courses"
    ON courses FOR DELETE
    USING (
        auth.uid() = instructor_id
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role::text = 'instructor'
        )
    );

CREATE POLICY "Instructors can insert videos to their courses"
    ON course_videos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN profiles p ON p.id = c.instructor_id
            WHERE c.id = course_id
            AND c.instructor_id = auth.uid()
            AND p.role::text = 'instructor'
        )
    );

CREATE POLICY "Instructors can update videos in their courses"
    ON course_videos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN profiles p ON p.id = c.instructor_id
            WHERE c.id = course_id
            AND c.instructor_id = auth.uid()
            AND p.role::text = 'instructor'
        )
    );

CREATE POLICY "Instructors can delete videos from their courses"
    ON course_videos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM courses c
            JOIN profiles p ON p.id = c.instructor_id
            WHERE c.id = course_id
            AND c.instructor_id = auth.uid()
            AND p.role::text = 'instructor'
        )
    );

-- 5. 강사 신청 추적을 위한 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'requested_instructor'
    ) THEN
        ALTER TABLE profiles ADD COLUMN requested_instructor BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 6. instructor_applications 테이블 (강사 신청 관리)
CREATE TABLE IF NOT EXISTS instructor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 중복 신청 방지를 위한 unique constraint (pending 상태만)
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_applications_pending
    ON instructor_applications(user_id)
    WHERE status = 'pending';

-- 7. 강사 신청 승인 시 자동으로 role 변경하는 함수
CREATE OR REPLACE FUNCTION approve_instructor_application()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE profiles
        SET role = 'instructor',
            requested_instructor = FALSE,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        NEW.reviewed_at = NOW();
    END IF;

    IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        UPDATE profiles
        SET requested_instructor = FALSE,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        NEW.reviewed_at = NOW();
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 트리거 생성
DROP TRIGGER IF EXISTS on_instructor_application_update ON instructor_applications;
CREATE TRIGGER on_instructor_application_update
    BEFORE UPDATE ON instructor_applications
    FOR EACH ROW
    EXECUTE FUNCTION approve_instructor_application();

-- 9. RLS 정책 for instructor_applications
ALTER TABLE instructor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON instructor_applications;
CREATE POLICY "Users can view own applications"
    ON instructor_applications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own applications" ON instructor_applications;
CREATE POLICY "Users can create own applications"
    ON instructor_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 10. 인덱스
CREATE INDEX IF NOT EXISTS idx_instructor_applications_user_id
    ON instructor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_status
    ON instructor_applications(status);
CREATE INDEX IF NOT EXISTS idx_profiles_requested_instructor
    ON profiles(requested_instructor) WHERE requested_instructor = TRUE;

-- 11. 코멘트
COMMENT ON TABLE instructor_applications IS '강사 신청 관리 테이블';
COMMENT ON COLUMN instructor_applications.status IS 'pending: 대기, approved: 승인, rejected: 거절';
COMMENT ON COLUMN profiles.requested_instructor IS '강사 신청 여부 (승인 대기 중이면 true)';
