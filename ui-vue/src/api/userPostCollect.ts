import request from '@/utils/request'
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

// User post collect API endpoints
export const userPostCollectApi = {
    // Collect a post
    collectPost: (postId: number, collectionId?: number): Promise<Result<any>> => {
        return request({
            url: '/api/user/post-collects',
            method: 'POST',
            data: {
                postId,
                collectionId: collectionId || 0
            }
        })
    },

    // Cancel collect a post
    cancelCollectPost: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/user/post-collects/${postId}`,
            method: 'DELETE'
        })
    },

    // Check if post is collected
    checkCollectStatus: (postId: number): Promise<Result<boolean>> => {
        return request({
            url: `/api/user/post-collects/${postId}/status`,
            method: 'GET'
        })
    },

    // Get current user's collects, optionally filtered by collectionId
    getUserCollects: (pageNum: number, pageSize: number, collectionId?: number): Promise<Result<PageResult<any>>> => {
        return request({
            url: '/api/user/post-collects',
            method: 'GET',
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
            method: 'GET',
            params: {
                pageNum,
                pageSize,
                ...(collectionId !== undefined ? { collectionId } : {})
            }
        })
    }
}