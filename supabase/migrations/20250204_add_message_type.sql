-- direct_messages 테이블에 메시지 타입과 메타데이터 컬럼 추가

-- 메시지 타입 enum 생성
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'pt_request', 'pt_schedule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- type 컬럼 추가 (기본값: 'text')
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS type message_type DEFAULT 'text';

-- 메타데이터 컬럼 추가 (PT 정보 등 구조화된 데이터 저장용)
ALTER TABLE direct_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- 기존 시스템 메시지 마이그레이션 (선택적)
UPDATE direct_messages
SET type = 'pt_request'
WHERE content LIKE '%[PT 신청]%' AND type = 'text';

UPDATE direct_messages
SET type = 'pt_schedule'
WHERE content LIKE '%[PT 일정 확정]%' AND type = 'text';

-- 타입별 인덱스 (시스템 메시지 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_direct_messages_type ON direct_messages(type);

COMMENT ON COLUMN direct_messages.type IS '메시지 타입: text(일반), pt_request(PT신청), pt_schedule(PT일정)';
COMMENT ON COLUMN direct_messages.metadata IS 'PT 신청/일정 등 구조화된 메타데이터 (JSON)';
