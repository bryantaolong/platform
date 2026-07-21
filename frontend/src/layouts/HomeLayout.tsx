import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  Input,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Message,
  Modal,
} from '@arco-design/web-react'
import {
  IconApps,
  IconUser,
  IconSettings,
  IconExport,
  IconSearch,
} from '@arco-design/web-react/icon'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/file'
import { getUnreadCount } from '@/api/user/userMessage'
import LlmChatDialog from '@/components/llm/LlmChatDialog'
import '@arco-design/web-react/dist/css/arco.css'
import './HomeLayout.css'

export default function HomeLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatVisible, setChatVisible] = useState(false)

  const isLoggedIn = userStore.isAuthenticated
  const isAdmin = userStore.isAdmin
  const isModerator = userStore.isModerator

  const loadUnreadCount = useCallback(async () => {
    if (!userStore.isAuthenticated) return
    try {
      const response = await getUnreadCount()
      if (response.code === 200) {
        setUnreadCount(response.data)
      }
    } catch (error) {
      console.error('获取未读消息数失败', error)
    }
  }, [userStore.isAuthenticated])

  useEffect(() => {
    if (userStore.isAuthenticated) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 15000)
      return () => clearInterval(interval)
    }
  }, [userStore.isAuthenticated, loadUnreadCount])

  const activeMenu = (() => {
    if (location.pathname === '/') return '/'
    if (location.pathname.startsWith('/hot')) return '/hot'
    if (location.pathname.startsWith('/recommend')) return '/recommend'
    if (location.pathname.startsWith('/following')) return '/following'
    if (location.pathname.startsWith('/messages') || location.pathname.startsWith('/chat')) return '/messages'
    if (location.pathname.startsWith('/post')) return '/post/list'
    return location.pathname
  })()

  const handleMenuClick = (key: string) => {
    if (key === 'ai-chat') {
      setChatVisible(true)
    } else {
      navigate(key)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/post/list?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleUserCommand = async (command: string) => {
    switch (command) {
      case 'profile':
        navigate('/profile')
        break
      case 'admin':
        if (isAdmin) {
          navigate('/admin/users')
        } else if (isModerator) {
          navigate('/admin/post-monitor')
        }
        break
      case 'logout':
        Modal.confirm({
          title: '提示',
          content: '确定要退出登录吗？',
          onOk: async () => {
            await userStore.logout()
            Message.success('已退出登录')
          },
        })
        break
    }
  }

  const menuItems = [
    { key: '/', label: '首页' },
    { key: '/post/list', label: '文章' },
    { key: '/hot', label: '热门' },
    ...(isLoggedIn ? [{ key: '/recommend', label: '推荐' }] : []),
    ...(isLoggedIn ? [{ key: '/following', label: '关注' }] : []),
    ...(isLoggedIn ? [{ key: '/messages', label: '消息' }] : []),
    { key: '/post/create', label: '写文章' },
    { key: 'ai-chat', label: 'AI对话' },
  ]

  return (
    <div className="app-layout">
      <header className="top-nav">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo" onClick={() => navigate('/')}>
              <IconApps style={{ fontSize: 28 }} />
              <span className="logo-text">Platform</span>
            </div>
          </div>

          <div className="nav-center">
            <Menu
              mode="horizontal"
              selectedKeys={[activeMenu]}
              onClickMenuItem={handleMenuClick}
              className="top-menu"
            >
              {menuItems.map((item) => (
                <Menu.Item key={item.key}>
                  {item.label}
                  {item.key === '/messages' && unreadCount > 0 && (
                    <Badge count={unreadCount > 99 ? '99+' : unreadCount} className="menu-badge" />
                  )}
                </Menu.Item>
              ))}
            </Menu>
          </div>

          <div className="nav-right">
            <Input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索文章..."
              prefix={<IconSearch />}
              allowClear
              className="search-input"
              onPressEnter={handleSearch}
            />

            {!isLoggedIn ? (
              <div className="auth-buttons">
                <Button shape="round" onClick={() => navigate('/login')}>登录</Button>
                <Button shape="round" type="primary" onClick={() => navigate('/register')}>注册</Button>
              </div>
            ) : (
              <Dropdown
                droplist={
                  <Menu onClickMenuItem={handleUserCommand}>
                    <Menu.Item key="profile">
                      <IconUser /> 个人中心
                    </Menu.Item>
                    {(isAdmin || isModerator) && (
                      <Menu.Item key="admin">
                        <IconSettings /> 管理后台
                      </Menu.Item>
                    )}
                    <Menu.Item key="logout">
                      <IconExport /> 退出登录
                    </Menu.Item>
                  </Menu>
                }
                trigger="hover"
              >
                <div className="user-info">
                  <Avatar size={32}>
                    <img src={getAvatarUrl(userStore.userProfile?.avatar)} alt="" />
                    {userStore.userInfo?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="username">{userStore.userInfo?.username}</span>
                </div>
              </Dropdown>
            )}
          </div>
        </div>
      </header>

      <LlmChatDialog visible={chatVisible} onClose={() => setChatVisible(false)} />

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 Platform. All Rights Reserved.</p>
          <p>
            <a href="/about">关于我们</a> | <a href="/contact">联系我们</a> | <a href="/privacy">隐私政策</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
