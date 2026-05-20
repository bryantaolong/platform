// src/models/request/post/PostCreateRequest.ts
export interface PostCreateRequest {
  title: string
  content: string
  categoryId?: number
  tags?: string
  weight?: number
}