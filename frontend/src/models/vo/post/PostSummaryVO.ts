export interface PostSummaryVO {
  id: number
  userId?: number
  author?: string
  title: string
  contentPreview: string  // 内容预览，限制长度
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