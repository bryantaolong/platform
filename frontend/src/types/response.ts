export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T> {
  rows: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}
