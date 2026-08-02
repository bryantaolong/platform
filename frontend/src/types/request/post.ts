import type { PostStatusEnum } from '../enum/post'

export interface PostCreateRequest {
  title: string
  content: string
  categoryId?: number
  tags?: string
  weight?: number
}

export interface PostUpdateRequest {
  id?: number
  title?: string
  content?: string
  categoryId?: number
  tags?: string
}

export interface PostSearchRequest {
  title?: string
  author?: string
  tags?: string
  status?: PostStatusEnum
}

export interface CommentCreateRequest {
  postId: number
  parentId?: number
  replyToUserId?: number
  content: string
}
