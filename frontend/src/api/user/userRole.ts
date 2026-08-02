import request from '@/utils/request.ts'
import type { ApiResponse } from '@/types/response'
import type { UserRoleOptionVO } from '@/types'

/**
 * 用户角色管理API
 */

/**
 * 获取全部角色下拉选项
 */
export function listRoles(): Promise<ApiResponse<UserRoleOptionVO[]>> {
  return request.get('/api/user-roles')
}
