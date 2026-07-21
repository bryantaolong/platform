import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/stores/user'
import { ReactNode, useEffect, useState } from 'react'

interface GuardProps {
  children: ReactNode
}

export function RequireAuth({ children }: GuardProps) {
  const location = useLocation()
  const token = useUserStore((s) => s.token)
  const userInfo = useUserStore((s) => s.userInfo)
  const fetchUserInfo = useUserStore((s) => s.fetchUserInfo)
  const clearToken = useUserStore((s) => s.clearToken)
  const [loading, setLoading] = useState(!userInfo && !!token)

  useEffect(() => {
    if (!userInfo && token) {
      fetchUserInfo().then((res) => {
        if (!res.success) {
          alert('认证信息失效，请重新登录！')
          clearToken()
        }
        setLoading(false)
      })
    }
  }, [userInfo, token, fetchUserInfo, clearToken])

  if (!token) {
    alert('您尚未登录，请先登录。')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!userInfo) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export function RequireAdmin({ children }: GuardProps) {
  const isAdmin = useUserStore((s) => s.isAdmin)
  const isModerator = useUserStore((s) => s.isModerator)

  if (!isAdmin && !isModerator) {
    alert('您没有权限访问此页面！')
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
