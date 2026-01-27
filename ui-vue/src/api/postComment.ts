import request from '@/utils/request'
import type {CommentVO} from '@/models/vo/post/CommentVO'
import type {CommentCreateRequest} from "@/models/request/post/CommentCreateRequest.ts";
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

export const commentApi = {
    getCommentsByPostId: (postId: number): Promise<Result<CommentVO[]>> => {
        return request({
            url: `/api/comments/post/${postId}`,
            method: 'GET'
        })
    },

    pageCommentsByPostId: (postId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<CommentVO>>> => {
        return request({
            url: `/api/comments/post/${postId}/page`,
            method: 'GET',
            params: {
                pageNum,
                pageSize
            }
        })
    },

    getCommentTree: (postId: number): Promise<Result<CommentVO[]>> => {
        return request({
            url: `/api/comments/post/${postId}/tree`,
            method: 'GET'
        })
    },

    getRepliesByCommentId: (commentId: number): Promise<Result<CommentVO[]>> => {
        return request({
            url: `/api/comments/${commentId}/replies`,
            method: 'GET'
        })
    },

    getHotComments: (postId: number, limit: number): Promise<Result<CommentVO[]>> => {
        return request({
            url: `/api/comments/post/${postId}/hot`,
            method: 'GET',
            params: {
                limit
            }
        })
    },

    getLatestComments: (postId: number, limit: number): Promise<Result<CommentVO[]>> => {
        return request({
            url: `/api/comments/post/${postId}/latest`,
            method: 'GET',
            params: {
                limit
            }
        })
    },

    getCommentById: (id: number): Promise<Result<CommentVO>> => {
        return request({
            url: `/api/comments/${id}`,
            method: 'GET'
        })
    },

    createComment: (data: CommentCreateRequest): Promise<Result<CommentVO>> => {
        return request({
            url: '/api/comments',
            method: 'POST',
            data
        })
    },

    deleteComment: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/comments/delete/${id}`,
            method: 'DELETE'
        })
    },

    likeComment: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/comments/${id}/like`,
            method: 'POST'
        })
    },

    unlikeComment: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/comments/${id}/unlike`,
            method: 'POST'
        })
    },

    checkLikeStatus: (id: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/comments/${id}/like/status`,
            method: 'GET'
        })
    }
}
