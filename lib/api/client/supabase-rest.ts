import axios, { AxiosRequestConfig } from "axios"
import { createClient } from "@/lib/client"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase 클라이언트에서 access token 가져오기
 */
export function getAccessToken(): string {
  const supabase = createClient()
  const accessToken = (supabase as any).changedAccessToken

  if (!accessToken) {
    throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.")
  }

  return accessToken
}

/**
 * 인증된 Supabase REST API 요청
 */
export async function supabaseRest<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    data?: any
    params?: Record<string, string>
  } = {}
): Promise<T> {
  const { method = "GET", data, params } = options
  const accessToken = getAccessToken()

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`

  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${accessToken}`,
      "Prefer": method === "POST" ? "return=representation" : undefined,
    },
    data,
    params,
  }

  try {
    const response = await axios(config)
    return response.data
  } catch (error: any) {
    console.error(`[SupabaseRest] ${method} ${endpoint} error:`, error.response?.data || error.message)
    throw new Error(error.response?.data?.message || error.message || "요청 실패")
  }
}

/**
 * 테이블 조회
 */
export async function supabaseSelect<T = any>(
  table: string,
  query: string = ""
): Promise<T[]> {
  const endpoint = query ? `${table}?${query}` : table
  return supabaseRest<T[]>(endpoint, { method: "GET" })
}

/**
 * 테이블 삽입
 */
export async function supabaseInsert<T = any>(
  table: string,
  data: any
): Promise<T[]> {
  return supabaseRest<T[]>(table, { method: "POST", data })
}

/**
 * 테이블 수정
 */
export async function supabaseUpdate<T = any>(
  table: string,
  query: string,
  data: any
): Promise<T[]> {
  const endpoint = `${table}?${query}`
  return supabaseRest<T[]>(endpoint, { method: "PATCH", data })
}

/**
 * 테이블 삭제
 */
export async function supabaseDelete(
  table: string,
  query: string
): Promise<void> {
  const endpoint = `${table}?${query}`
  await supabaseRest(endpoint, { method: "DELETE" })
}

/**
 * RPC 함수 호출
 */
export async function supabaseRpc<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<T> {
  const accessToken = getAccessToken()
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`

  try {
    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${accessToken}`,
      },
    })
    return response.data
  } catch (error: any) {
    console.error(`[SupabaseRpc] ${functionName} error:`, error.response?.data || error.message)
    throw new Error(error.response?.data?.message || error.message || "RPC 호출 실패")
  }
}
