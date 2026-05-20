import request from '@/utils/request.ts'
import type { Result, PageResult } from '@/models/response'
import type { UserProfileVO } from '@/models/vo/user'

/**
 * 用户关注API
 */

/**
 * 关注用户
 */
export function followUser(followingId: number): Promise<Result<boolean>> {
  return request.post(`/api/user-follows/follow/${followingId}`)
}

/**
 * 查询指定用户关注的用户列表（分页）。
 */
export function listFollowingUsers(userId: number, pageNum = 1, pageSize = 10): Promise<Result<PageResult<UserProfileVO>>> {
  return request.get(`/api/user-follows/following/${userId}`, {
    params: { pageNum, pageSize }
  })
}

/**
 * 查询指定用户的粉丝列表（分页）。
 */
export function listFollowerUsers(userId: number, pageNum = 1, pageSize = 10): Promise<Result<PageResult<UserProfileVO>>> {
  return request.get(`/api/user-follows/followers/${userId}`, {
    params: { pageNum, pageSize }
  })
}

/**
 * 检查当前用户是否关注指定用户。
 */
export function isFollowing(followingId: number): Promise<Result<boolean>> {
  return request.get(`/api/user-follows/check/${followingId}`)
}

/**
 * 获取指定用户的关注数和粉丝数。
 */
export function getUserFollowStats(userId: number): Promise<Result<{ followingCount: number, followerCount: number }>> {
  return request.get(`/api/user-follows/stats/${userId}`)
}

/**
 * 当前用户取消关注指定用户。
 */
export function unfollowUser(followingId: number): Promise<Result<boolean>> {
  return request.post(`/api/user-follows/unfollow/${followingId}`)
}