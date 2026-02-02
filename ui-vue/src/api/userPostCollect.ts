import request from '@/utils/request'
import type {Result} from "@/models/response/Result.ts";
import type {PageResult} from "@/models/response/PageResult.ts";

// User post collect API endpoints

// 收藏博文
export function collectPost(postId: number, collectionId?: number): Promise<Result<any>> {
    return request({
        url: '/api/user/post-collects',
        method: 'POST',
        data: {
            postId,
            collectionId: collectionId || 0
        }
    })
}

// 分页查询指定用户的收藏列表
export function listUserCollectsByUser(userId: number, pageNum: number, pageSize: number, collectionId?: number): Promise<Result<PageResult<any>>> {
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

// 获取当前登录用户的收藏列表（可按 collectionId 筛选）
export function listUserCollects(pageNum: number, pageSize: number, collectionId?: number): Promise<Result<PageResult<any>>> {
    return request({
        url: '/api/user/post-collects',
        method: 'GET',
        params: {
            pageNum,
            pageSize,
            ...(collectionId !== undefined ? { collectionId } : {})
        }
    })
}

// 分页查询当前用户指定收藏夹的收藏
export function listUserCollectsByCollection(collectionId: number, pageNum: number, pageSize: number): Promise<Result<PageResult<any>>> {
    return request({
        url: `/api/user/post-collects/collection/${collectionId}`,
        method: 'GET',
        params: {
            pageNum,
            pageSize
        }
    })
}

// 检查当前用户是否已收藏指定博文
export function checkCollectStatus(postId: number): Promise<Result<boolean>> {
    return request({
        url: `/api/user/post-collects/${postId}/status`,
        method: 'GET'
    })
}

// 获取当前用户收藏总数
export function getUserCollectCount(): Promise<Result<number>> {
    return request({
        url: '/api/user/post-collects/count',
        method: 'GET'
    })
}

// 取消收藏博文
export function cancelCollectPost(postId: number): Promise<Result<boolean>> {
    return request({
        url: `/api/user/post-collects/${postId}`,
        method: 'DELETE'
    })
}