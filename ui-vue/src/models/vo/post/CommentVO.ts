export interface CommentVO {
  id: number
  postId: number
  rootId: number
  parentId: number
  type: number
  content: string
  replyToUserId?: number
  replyToUsername?: string
  floor?: number
  likeCount: number
  dislikeCount: number
  childCount: number
  status: string
  createdAt: string
  updatedAt: string
  userId?: number
  username?: string
  avatar?: string
  replies?: CommentVO[]
}
