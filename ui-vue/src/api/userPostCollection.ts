import request from '@/utils/request'
import type { Result } from '@/models/response/Result.ts'

/**
 * UserPostCollection API
 *
 * 提供当前登录用户的收藏夹相关操作，包括查询收藏夹列表和创建收藏夹。
 */
export interface UserPostCollection {
  id: number
  userId: number
  folderName: string
  createdAt?: string
  updatedAt?: string
}

export const userPostCollectionApi = {
  /**
   * 获取当前登录用户的收藏夹列表
   */
  getCollections: (): Promise<Result<UserPostCollection[]>> => {
    return request({
      url: '/api/user/post-collections',
      method: 'GET'
    })
  },

  /**
   * 创建收藏夹
   */
  createCollection: (folderName: string): Promise<Result<UserPostCollection>> => {
    return request({
      url: '/api/user/post-collections',
      method: 'POST',
      params: { folderName }
    })
  },

  /**
   * 获取指定用户的收藏夹列表（用于在用户主页查看其收藏夹）
   */
  getCollectionsByUser: (userId: number): Promise<Result<UserPostCollection[]>> => {
    return request({
      url: `/api/user/post-collections/user/${userId}`,
      method: 'GET'
    })
  }
}