import request from '@/utils/request.ts'
import type { Result } from '@/models/response/Result.ts'

/**
 * 获取热门帖子排行榜
 */
export function listHotPosts(limit: number = 10): Promise<Result<any[]>> {
  return request({
    url: '/api/posts/hot',
    method: 'GET',
    params: { limit }
  })
}

