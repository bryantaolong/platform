import request from '@/utils/request'
import type {CommentVO} from '@/models/vo/post/CommentVO'
import type {CommentCreateRequest} from "@/models/request/post/CommentCreateRequest.ts";
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

export const commentApi = {
  getCommentsByPostId: (postId: number): Promise<Result<CommentVO[]>> => {
    return request({
      url: `/api/comments/post/${postId}`,
      method: 'get'
    })
  },

  pageCommentsByPostId: (postId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<CommentVO>>> => {
    return request({
      url: `/api/comments/post/${postId}/page`,
      method: 'get',
      params: {
        pageNum,
        pageSize
      }
    })
  },

  getCommentTree: (postId: number): Promise<Result<CommentVO[]>> => {
    return request({
      url: `/api/comments/post/${postId}/tree`,
      method: 'get'
    })
  },

  getRepliesByCommentId: (commentId: number): Promise<Result<CommentVO[]>> => {
    return request({
      url: `/api/comments/${commentId}/replies`,
      method: 'get'
    })
  },

  getHotComments: (postId: number, limit: number): Promise<Result<CommentVO[]>> => {
    return request({
      url: `/api/comments/post/${postId}/hot`,
      method: 'get',
      params: {
        limit
      }
    })
  },

  getLatestComments: (postId: number, limit: number): Promise<Result<CommentVO[]>> => {
    return request({
      url: `/api/comments/post/${postId}/latest`,
      method: 'get',
      params: {
        limit
      }
    })
  },

  getCommentById: (id: number): Promise<Result<CommentVO>> => {
    return request({
      url: `/api/comments/${id}`,
      method: 'get'
    })
  },

  createComment: (data: CommentCreateRequest): Promise<Result<CommentVO>> => {
    return request({
      url: '/api/comments',
      method: 'post',
      data
    })
  },

  deleteComment: (id: number): Promise<Result<boolean>> => {
    return request({
      url: `/api/comments/${id}`,
      method: 'delete'
    })
  },

  likeComment: (id: number): Promise<Result<boolean>> => {
    return request({
      url: `/api/comments/${id}/like`,
      method: 'post'
    })
  },

  unlikeComment: (id: number): Promise<Result<boolean>> => {
    return request({
      url: `/api/comments/${id}/unlike`,
      method: 'post'
    })
  },

  checkLikeStatus: (id: number): Promise<Result<boolean>> => {
    return request({
      url: `/api/comments/${id}/like/status`,
      method: 'get'
    })
  }
}
