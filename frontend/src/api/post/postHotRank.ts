import request from '@/utils/request.ts'
import type { ApiResponse } from '@/models/response'

/**
 * 获取热门帖子排行榜
 */
export function listHotPosts(limit: number = 10): Promise<ApiResponse<any[]>> {
  return request({
    url: '/api/posts/hot',
    method: 'GET',
    params: { limit }
  })
}

