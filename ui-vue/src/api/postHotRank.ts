import request from '@/utils/request'
import type { Result } from '@/models/response/Result'

export interface PostHotRankWeight {
  id: number
  metricKey: string
  metricValue: number
  description?: string
}

export const postHotRankApi = {
  // 获取热度算法权重配置列表
  getWeights: (): Promise<Result<PostHotRankWeight[]>> => {
    return request({
      url: '/api/admin/post-algorithm/weights',
      method: 'GET'
    })
  },

  // 更新单个指标的权重
  updateWeight: (
    id: number,
    metricValue: number
  ): Promise<Result<PostHotRankWeight>> => {
    return request({
      url: `/api/admin/post-algorithm/weights/${id}`,
      method: 'PUT',
      params: { metricValue }
    })
  }
}

