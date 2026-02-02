import request from '@/utils/request'
import type { Result } from '@/models/response/Result'
import type { Post } from '@/models/entity/post/Post'

/**
 * PostAlgorithmAdminController API
 * 博文算法管理控制器
 * 统一管理博文推荐算法相关的后台配置接口，包括算法权重配置和博文置顶管理
 */
export const postAlgorithmAdminApi = {
  /**
   * 查询全部算法权重配置
   */
  listWeights(): Promise<Result<{ id: number; metricKey: string; metricValue: number; description?: string }[]>> {
    return request({
      url: '/api/admin/post-algorithm/weights',
      method: 'GET'
    })
  },

  /**
   * 更新单个指标的权重值
   */
  updateWeight(id: number, metricValue: number) {
    return request({
      url: `/api/admin/post-algorithm/weights/${id}`,
      method: 'PUT',
      params: { metricValue }
    })
  },

  /**
   * 管理员设置博文权重（用于人工置顶与排序干预）
   */
  updatePostWeight(postId: number, weight: number): Promise<Result<Post>> {
    return request({
      url: `/api/admin/post-algorithm/posts/${postId}/weight`,
      method: 'PUT',
      params: { weight }
    })
  },

  /**
   * 管理员置顶博文
   */
  pinPost(postId: number): Promise<Result<Post>> {
    return request({
      url: `/api/admin/post-algorithm/posts/${postId}/pin`,
      method: 'PUT'
    })
  },

  /**
   * 管理员取消博文置顶
   */
  unpinPost(postId: number): Promise<Result<Post>> {
    return request({
      url: `/api/admin/post-algorithm/posts/${postId}/unpin`,
      method: 'PUT'
    })
  }
}
