import request from '@/utils/request.ts'
import type { Result } from '@/models/response'
import type { UserRoleOptionVO } from '@/models/vo/user'

/**
 * 用户角色管理API
 */

/**
 * 获取全部角色下拉选项
 */
export function listRoles(): Promise<Result<UserRoleOptionVO[]>> {
  return request.get('/api/user-roles')
}
