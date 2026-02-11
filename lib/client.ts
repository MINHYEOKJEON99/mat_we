import { createBrowserClient } from "@supabase/ssr"

// LockManager API 에러 방지를 위한 no-op lock 함수
// GitHub issue: https://github.com/supabase/supabase-js/issues/1517
const noOpLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  return await fn()
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        lock: noOpLock,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}
