import request from '@/utils/request.ts'
import type { ApiResponse } from '@/types/response'
import type { UserPostCollection } from '@/types'

/**
 * UserPostCollection API
 *
 * 提供当前登录用户的收藏夹相关操作，包括查询收藏夹列表和创建收藏夹。
 */

/**
 * 创建收藏夹
 */
export function createCollection(folderName: string): Promise<ApiResponse<UserPostCollection>> {
  return request({
    url: '/api/user/post-collections',
    method: 'POST',
    params: { folderName }
  })
}

/**
 * 获取当前登录用户的收藏夹列表
 */
export function listCollections(): Promise<ApiResponse<UserPostCollection[]>> {
  return request({
    url: '/api/user/post-collections',
    method: 'GET'
  })
}

/**
 * 获取指定用户的收藏夹列表（用于在用户主页查看其收藏夹）
 */
export function listCollectionsByUser(userId: number): Promise<ApiResponse<UserPostCollection[]>> {
  return request({
    url: `/api/user/post-collections/user/${userId}`,
    method: 'GET'
  })
}

/**
 * 根据主键查询单个收藏夹详情
 */
export function getCollectionById(collectionId: number): Promise<ApiResponse<UserPostCollection>> {
  return request({
    url: `/api/user/post-collections/${collectionId}`,
    method: 'GET'
  })
}

/**
 * 获取当前用户收藏夹数量
 */
export function getUserCollectionCount(): Promise<ApiResponse<number>> {
  return request({
    url: '/api/user/post-collections/count',
    method: 'GET'
  })
}

/**
 * 更新收藏夹名称
 */
export function updateCollection(collectionId: number, folderName: string): Promise<ApiResponse<UserPostCollection>> {
  return request({
    url: `/api/user/post-collections/${collectionId}`,
    method: 'PUT',
    params: { folderName }
  })
}

/**
 * 删除收藏夹
 */
export function deleteCollection(collectionId: number): Promise<ApiResponse<boolean>> {
  return request({
    url: `/api/user/post-collections/${collectionId}`,
    method: 'DELETE'
  })
}