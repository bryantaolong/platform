import request from '@/utils/request'
import type { Result } from '@/models/response/Result'
import type { PageResult } from '@/models/response/PageResult'
import type { SysUser } from '@/models/entity/user/SysUser.ts'

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
   * 取消关注用户
   */
  unfollowUser(followingId: number): Promise<Result<boolean>> {
    return request.post(`/api/user-follows/unfollow/${followingId}`)
  },

  /**
   * 获取用户的关注列表
   */
  getFollowingUsers(userId: number, pageNum = 1, pageSize = 10): Promise<Result<PageResult<SysUser>>> {
    return request.get(`/api/user-follows/following/${userId}`, {
      params: { pageNum, pageSize }
    })
  },

  /**
   * 获取用户的粉丝列表
   */
  getFollowerUsers(userId: number, pageNum = 1, pageSize = 10): Promise<Result<PageResult<SysUser>>> {
    return request.get(`/api/user-follows/followers/${userId}`, {
      params: { pageNum, pageSize }
    })
  },

  /**
   * 检查是否关注了指定用户
   */
  checkFollowing(followingId: number): Promise<Result<boolean>> {
    return request.get(`/api/user-follows/check/${followingId}`)
  },

  /**
   * 获取用户的关注数和粉丝数
   */
  getUserFollowStats(userId: number): Promise<Result<{ followingCount: number, followerCount: number }>> {
    return request.get(`/api/user-follows/stats/${userId}`)
  }
}