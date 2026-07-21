import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Breadcrumb, Message, Modal } from '@arco-design/web-react'
import {
  IconApps,
  IconHome,
  IconUser,
  IconFile,
  IconSettings,
  IconExport,
} from '@arco-design/web-react/icon'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/file'
import './AdminLayout.css'

const { Sider, Header, Content } = Layout

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const userStore = useUserStore()
  const isAdmin = userStore.isAdmin

  const handleMenuClick = (key: string) => {
    navigate(key)
  }

  const handleUserCommand = async (command: string) => {
    switch (command) {
      case 'profile':
        navigate('/admin/profile')
        break
      case 'logout':
        Modal.confirm({
          title: '提示',
          content: '确定要退出登录吗？',
          onOk: async () => {
            await userStore.logout()
            navigate('/login')
            Message.success('已退出登录')
          },
        })
        break
    }
  }

  const menuItems = [
    { key: '/', icon: <IconHome />, label: '返回首页' },
    ...(isAdmin ? [{ key: '/admin/users', icon: <IconUser />, label: '用户管理' }] : []),
    { key: '/admin/posts', icon: <IconFile />, label: '博文管理' },
    { key: '/admin/audit', icon: <IconFile />, label: '博文审核' },
    { key: '/admin/post-monitor', icon: <IconFile />, label: '博文数据监控' },
    { key: '/admin/profile', icon: <IconUser />, label: '个人中心' },
    ...(isAdmin ? [{ key: '/admin/logs', icon: <IconFile />, label: '系统日志' }] : []),
    ...(isAdmin ? [{ key: '/admin/settings', icon: <IconSettings />, label: '系统设置' }] : []),
  ]

  const pathLabels: Record<string, string> = {
    admin: '管理后台',
    users: '用户管理',
    posts: '博文管理',
    'post-monitor': '数据监控',
    audit: '博文审核',
    profile: '个人中心',
    logs: '系统日志',
    settings: '系统设置',
  }

  const breadcrumbItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/')
      return { path, label: pathLabels[segment] || segment }
    })

  return (
    <div className="admin-layout">
      <Layout className="layout-container">
        <Sider width={240} className="layout-aside">
          <div className="aside-header">
            <div className="logo">
              <IconApps style={{ fontSize: 24 }} />
              <span className="logo-text">用户管理系统</span>
            </div>
          </div>
          <Menu
            selectedKeys={[location.pathname]}
            onClickMenuItem={handleMenuClick}
            className="aside-menu"
          >
            {menuItems.map((item) => (
              <Menu.Item key={item.key}>
                {item.icon} {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Layout className="layout-main">
          <Header className="layout-header">
            <div className="header-left">
              <Breadcrumb>
                {breadcrumbItems.map((item) => (
                  <Breadcrumb.Item key={item.path} onClick={() => navigate(item.path)}>
                    {item.label}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </div>

            <div className="header-right">
              <Dropdown
                droplist={
                  <Menu onClickMenuItem={handleUserCommand}>
                    <Menu.Item key="profile">
                      <IconUser /> 个人中心
                    </Menu.Item>
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
            </div>
          </Header>

          <Content className="layout-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
