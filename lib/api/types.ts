/**
 * Shared API response types
 */
export type ApiResponse<T> = {
  data: T
  error: null
} | {
  data: null
  error: string
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number
  limit?: number
}

/**
 * Filter options for queries
 */
export interface FilterOptions {
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}
