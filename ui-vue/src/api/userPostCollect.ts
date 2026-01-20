import request from '@/utils/request'
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

// User post collect API endpoints
export const userPostCollectApi = {
    // Collect a post
    collectPost: (postId: number, collectionId?: number): Promise<Result<any>> => {
        return request({
            url: '/api/user/post-collects',
            method: 'post',
            data: {
                postId,
                collectionId: collectionId || 0
            }
        })
    },

    // Uncollect a post
    uncollectPost: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/user/post-collects/${postId}`,
            method: 'delete'
        })
    },

    // Check if post is collected
    checkCollectStatus: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/user/post-collects/${postId}/status`,
            method: 'get'
        })
    },

    // Get current user's collects, optionally filtered by collectionId
    getUserCollects: (pageNum: number, pageSize: number, collectionId?: number): Promise<Result<PageResult<any>>> => {
        return request({
            url: '/api/user/post-collects',
            method: 'get',
            params: {
                pageNum,
                pageSize,
                ...(collectionId !== undefined ? { collectionId } : {})
            }
        })
    },

    // Get collects of specified user, optionally filtered by collectionId
    getUserCollectsByUser: (userId: number, pageNum: number, pageSize: number, collectionId?: number): Promise<Result<PageResult<any>>> => {
        return request({
            url: `/api/user/post-collects/user/${userId}`,
            method: 'get',
            params: {
                pageNum,
                pageSize,
                ...(collectionId !== undefined ? { collectionId } : {})
            }
        })
    }
}