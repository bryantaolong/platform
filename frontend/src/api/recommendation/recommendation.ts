import request from '@/utils/request.ts'
import type { ApiResponse } from '@/types/response'
import type { PostVO, PostSummaryVO } from '@/types'

/**
 * 获取个性化推荐内容流
 * @param page 页码（从0开始）
 * @param pageSize 每页数量
 */
export function getPersonalizedFeed(
  page: number = 0,
  pageSize: number = 20
): Promise<ApiResponse<PostVO[]>> {
  return request({
    url: '/api/recommendation/feed',
    method: 'GET',
    params: { page, pageSize }
  })
}

/**
 * 获取个性化推荐内容流（摘要形式）
 * @param page 页码（从0开始）
 * @param pageSize 每页数量
 */
export function getPersonalizedFeedSummary(
  page: number = 0,
  pageSize: number = 20
): Promise<ApiResponse<PostSummaryVO[]>> {
  return request({
    url: '/api/recommendation/feed/summary',
    method: 'GET',
    params: { page, pageSize }
  })
}

/**
 * 获取新用户热门推荐（冷启动）
 * @param page 页码（从0开始）
 * @param pageSize 每页数量
 */
export function getHotFeedForNewUser(
  page: number = 0,
  pageSize: number = 20
): Promise<ApiResponse<PostVO[]>> {
  return request({
    url: '/api/recommendation/hot/new-user',
    method: 'GET',
    params: { page, pageSize }
  })
}

/**
 * 获取当前用户的兴趣标签
 * @param limit 返回数量限制
 */
export function getUserInterests(
  limit: number = 10
): Promise<ApiResponse<string[]>> {
  return request({
    url: '/api/recommendation/interests',
    method: 'GET',
    params: { limit }
  })
}

/**
 * 手动刷新用户画像
 */
export function refreshUserProfile(): Promise<ApiResponse<null>> {
  return request({
    url: '/api/recommendation/profile/refresh',
    method: 'POST'
  })
}
