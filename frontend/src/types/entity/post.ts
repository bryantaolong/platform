export interface Post {
  id?: number
  userId?: number
  title: string
  content: string
  status?: string
  categoryId?: number
  tags: string[]
  commentAreaStatus?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
  collectCount?: number
  shareCount?: number
  weight?: number
  deleted?: number
  version?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface UserPostCollection {
  id: number
  userId: number
  folderName: string
  createdAt?: string
  updatedAt?: string
}
