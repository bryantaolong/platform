import request from '@/utils/request.ts'
import type { ApiResponse } from '@/types/response'
import type { Post } from '@/types'

/**
 * PostAlgorithmAdminController API
 * 博文算法管理控制器
 * 统一管理博文推荐算法相关的后台配置接口，包括算法权重配置和博文置顶管理
 */

/**
 * 查询全部算法权重配置
 */
export function listWeights(): Promise<ApiResponse<{ id: number; metricKey: string; metricValue: number; description?: string }[]>> {
  return request({
    url: '/api/admin/post-algorithm/weights',
    method: 'GET'
  })
}

/**
 * 更新单个指标的权重值
 */
export function updateWeight(id: number, metricValue: number) {
  return request({
    url: `/api/admin/post-algorithm/weights/${id}`,
    method: 'PUT',
    params: { metricValue }
  })
}

/**
 * 管理员设置博文权重（用于人工置顶与排序干预）
 */
export function updatePostWeight(postId: number, weight: number): Promise<ApiResponse<Post>> {
  return request({
    url: `/api/admin/post-algorithm/posts/${postId}/weight`,
    method: 'PUT',
    params: { weight }
  })
}

/**
 * 管理员置顶博文
 */
export function pinPost(postId: number): Promise<ApiResponse<Post>> {
  return request({
    url: `/api/admin/post-algorithm/posts/${postId}/pin`,
    method: 'PUT'
  })
}

/**
 * 管理员取消博文置顶
 */
export function unpinPost(postId: number): Promise<ApiResponse<Post>> {
  return request({
    url: `/api/admin/post-algorithm/posts/${postId}/unpin`,
    method: 'PUT'
  })
}
