-- 강사 신청 테이블
CREATE TABLE IF NOT EXISTS instructor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_role VARCHAR(20) NOT NULL DEFAULT 'student',
  to_role VARCHAR(20) NOT NULL DEFAULT 'instructor',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_instructor_applications_user ON instructor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_status ON instructor_applications(status);

-- RLS 정책
ALTER TABLE instructor_applications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 신청만 조회 가능
CREATE POLICY "Users can view own applications" ON instructor_applications
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 신청 생성 가능
CREATE POLICY "Users can create applications" ON instructor_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 서비스 역할로 모든 작업 가능 (관리자용)
CREATE POLICY "Service role can do all" ON instructor_applications
  FOR ALL USING (true) WITH CHECK (true);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_instructor_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_instructor_applications_updated_at ON instructor_applications;

CREATE TRIGGER update_instructor_applications_updated_at
  BEFORE UPDATE ON instructor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_application_updated_at();
