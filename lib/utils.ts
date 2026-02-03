import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷팅 (천 단위 콤마)
export function formatPrice(value: string | number): string {
  const numbers = String(value).replace(/[^\d]/g, "")
  if (!numbers) return ""
  return parseInt(numbers, 10).toLocaleString("ko-KR")
}

// 콤마 제거 (숫자만 반환)
export function parsePrice(value: string): string {
  return value.replace(/,/g, "")
}

// HTML 태그 제거 함수
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}
