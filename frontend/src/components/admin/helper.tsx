import { Tag } from '@arco-design/web-react'

export const formatDateTime = (dateString: string | undefined | null) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', { hour12: false })
}

export const getStatusTag = (status: string) => {
  if (status === 'NORMAL') return <Tag color="green">正常</Tag>
  if (status === 'LOCKED') return <Tag color="orange">锁定</Tag>
  return <Tag color="red">封禁</Tag>
}

export const getRoleTag = (roles: string) => {
  if (roles.includes('ROLE_ADMIN')) return <Tag color="red">管理员</Tag>
  return <Tag color="gray">普通用户</Tag>
}
