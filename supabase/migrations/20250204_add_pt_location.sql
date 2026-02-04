-- Add location fields to pt_sessions table
ALTER TABLE pt_sessions
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS location_detail TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pt_sessions.location IS 'PT 장소 주소 (도로명/지번)';
COMMENT ON COLUMN pt_sessions.location_detail IS 'PT 장소 상세 주소 (동/호수 등)';
