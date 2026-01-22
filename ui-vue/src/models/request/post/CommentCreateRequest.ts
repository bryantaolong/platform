export interface CommentCreateRequest {
    postId: number
    parentId?: number
    replyToUserId?: number
    content: string
}
