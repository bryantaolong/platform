import request from '@/utils/request'
import type { Result } from '@/models/response/Result'
import type { PageResult } from '@/models/response/PageResult'
import type { UserProfileVO } from '@/models/vo/user/UserProfileVO.ts'

/**
 * 用户关注API
 */
export const userFollowApi = {
  /**
   * 关注用户
   */
  followUser(followingId: number): Promise<Result<boolean>> {
    return request.post(`/api/user-follows/follow/${followingId}`)
  },
  /**
   * 查询指定用户关注的用户列表（分页）。
   */
  listFollowingUsers(userId: number, pageNum = 1, pageSize = 10): Promise<Result<PageResult<UserProfileVO>>> {
    return request.get(`/api/user-follows/following/${userId}`, {
      params: { pageNum, pageSize }
    })
  },

  /**
   * 查询指定用户的粉丝列表（分页）。
   */
  listFollowerUsers(userId: number, pageNum = 1, pageSize = 10): Promise<Result<PageResult<UserProfileVO>>> {
    return request.get(`/api/user-follows/followers/${userId}`, {
      params: { pageNum, pageSize }
    })
  },

  /**
   * 检查当前用户是否关注指定用户。
   */
  isFollowing(followingId: number): Promise<Result<boolean>> {
    return request.get(`/api/user-follows/check/${followingId}`)
  },

  /**
   * 获取指定用户的关注数和粉丝数。
   */
  getUserFollowStats(userId: number): Promise<Result<{ followingCount: number, followerCount: number }>> {
    return request.get(`/api/user-follows/stats/${userId}`)
  },

  /**
   * 当前用户取消关注指定用户。
   */
  unfollowUser(followingId: number): Promise<Result<boolean>> {
    return request.post(`/api/user-follows/unfollow/${followingId}`)
  }
}