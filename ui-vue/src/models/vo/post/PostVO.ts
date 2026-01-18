// src/models/vo/post/PostVO.ts

export interface PostVO {
  id: number
  userId?: number
  author?: string
  title: string
  content: string
  status: string
  categoryId?: number
  tags?: string[]
  commentAreaStatus?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  collectCount?: number
  shareCount?: number
  createdAt: string
  updatedAt: string
}