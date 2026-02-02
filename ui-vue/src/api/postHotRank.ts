import request from '@/utils/request'
import type { Result } from '@/models/response/Result'

export interface PostHotRankWeight {
  id: number
  metricKey: string
  metricValue: number
  description?: string
}

export const postHotRankApi = {
  /**
   * 获取热门帖子排行榜
   */
  listHotPosts: (limit: number = 10): Promise<Result<any[]>> => {
    return request({
      url: '/api/posts/hot',
      method: 'GET',
      params: { limit }
    })
  }
}

