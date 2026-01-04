// src/models/request/post/PostUpdateRequest.ts
export interface PostUpdateRequest {
  id?: number
  title?: string
  content?: string
  categoryId?: number
  tags?: string
  weight?: number
}