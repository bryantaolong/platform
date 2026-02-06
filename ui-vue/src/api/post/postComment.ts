import request from '@/utils/request'
import type {CommentVO} from '@/models/vo/post/CommentVO'
import type {CommentCreateRequest} from "@/models/request/post/CommentCreateRequest.ts";
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

// Create a comment
export function createComment(data: CommentCreateRequest): Promise<Result<CommentVO>> {
    return request({
        url: '/api/comments',
        method: 'POST',
        data
    })
}

// 根据帖子 ID 查询全部评论列表（平铺）
export function listCommentsByPostId(postId: number): Promise<Result<CommentVO[]>> {
    return request({
        url: `/api/comments/post/${postId}`,
        method: 'GET'
    })
}

// 分页查询指定帖子的评论
export function listCommentsByPostIdPage(postId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<CommentVO>>> {
    return request({
        url: `/api/comments/post/${postId}/page`,
        method: 'GET',
        params: {
            pageNum,
            pageSize
        }
    })
}

// 获取指定帖子的评论树（含父子层级）
export function getCommentTree(postId: number): Promise<Result<CommentVO[]>> {
    return request({
        url: `/api/comments/post/${postId}/tree`,
        method: 'GET'
    })
}

// 查询某条评论的直接回复列表
export function listRepliesByCommentId(commentId: number): Promise<Result<CommentVO[]>> {
    return request({
        url: `/api/comments/${commentId}/replies`,
        method: 'GET'
    })
}

// 查询热门评论（按点赞数倒序）
export function listHotComments(postId: number, limit: number): Promise<Result<CommentVO[]>> {
    return request({
        url: `/api/comments/post/${postId}/hot`,
        method: 'GET',
        params: {
            limit
        }
    })
}

// 查询最新评论（按创建时间倒序）
export function listLatestComments(postId: number, limit: number): Promise<Result<CommentVO[]>> {
    return request({
        url: `/api/comments/post/${postId}/latest`,
        method: 'GET',
        params: {
            limit
        }
    })
}

// 根据主键查询单条评论
export function getCommentById(id: number): Promise<Result<CommentVO>> {
    return request({
        url: `/api/comments/${id}`,
        method: 'GET'
    })
}

// 删除评论（逻辑删除）
export function deleteComment(id: number): Promise<Result<boolean>> {
    return request({
        url: `/api/comments/${id}`,
        method: 'DELETE'
    })
}

// 点赞评论
export function likeComment(id: number): Promise<Result<boolean>> {
    return request({
        url: `/api/comments/${id}/like`,
        method: 'POST'
    })
}

// 取消点赞评论
export function unlikeComment(id: number): Promise<Result<boolean>> {
    return request({
        url: `/api/comments/${id}/unlike`,
        method: 'POST'
    })
}

// 查询当前用户对某条评论的点赞状态
export function checkLikeStatus(id: number): Promise<Result<boolean>> {
    return request({
        url: `/api/comments/${id}/like/status`,
        method: 'GET'
    })
}
