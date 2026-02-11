-- PT 기능을 위한 profiles 테이블 확장 (강사 전용)
-- 2025-02-03

-- PT 시간당 가격
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pt_price_per_hour INTEGER DEFAULT NULL;

-- PT 소개글
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pt_description TEXT DEFAULT NULL;

-- 코멘트 추가
COMMENT ON COLUMN profiles.pt_price_per_hour IS 'PT 시간당 가격 (원)';
COMMENT ON COLUMN profiles.pt_description IS 'PT 소개글';
