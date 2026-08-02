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
  weight?: number
  createdAt: string
  updatedAt: string
  /**
   * 热度分数（仅用于热度排行榜）
   */
  hotScore?: number
}

export interface PostSummaryVO {
  id: number
  userId?: number
  author?: string
  title: string
  contentPreview: string // 内容预览，限制长度
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
