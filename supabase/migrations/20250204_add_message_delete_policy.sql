-- direct_messages 테이블에 DELETE 정책 추가
-- 사용자는 본인이 보낸 메시지만 삭제 가능

CREATE POLICY "Users can delete their own messages"
  ON direct_messages FOR DELETE
  USING (
    auth.uid() = sender_id
  );
