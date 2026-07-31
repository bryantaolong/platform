import { h } from 'vue'
import { Tag } from '@arco-design/web-vue'

export const formatDateTime = (dateString: string | undefined | null) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', { hour12: false })
}

export const getStatusTag = (status: string) => {
  if (status === 'NORMAL') return h(Tag, { color: 'green' }, () => '正常')
  if (status === 'LOCKED') return h(Tag, { color: 'orange' }, () => '锁定')
  return h(Tag, { color: 'red' }, () => '封禁')
}

export const getRoleTag = (roles: string) => {
  if (roles.includes('ROLE_ADMIN')) return h(Tag, { color: 'red' }, () => '管理员')
  return h(Tag, { color: 'gray' }, () => '普通用户')
}
