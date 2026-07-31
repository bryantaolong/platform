<template>
  <div className="admin-layout">
    <a-layout class="layout-container">
      <a-layout-sider :width="240" class="layout-aside">
        <div className="aside-header">
          <div className="logo">
            <icon-apps style="font-size: 24px" />
            <span className="logo-text">用户管理系统</span>
          </div>
        </div>
        <a-menu
          :selected-keys="[route.path]"
          @menu-item-click="handleMenuClick"
          class="aside-menu"
        >
          <a-menu-item v-for="item in menuItems" :key="item.key">
            <template v-if="item.icon" #icon><component :is="item.icon" /></template>
            {{ item.label }}
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <a-layout class="layout-main">
        <a-layout-header class="layout-header">
          <div className="header-left">
            <a-breadcrumb>
              <a-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path" @click="navigate(item.path)">
                {{ item.label }}
              </a-breadcrumb-item>
            </a-breadcrumb>
          </div>

          <div className="header-right">
            <a-dropdown trigger="hover">
              <template #content>
                <a-menu @menu-item-click="handleUserCommand">
                  <a-menu-item key="profile">
                    <template #icon><icon-user /></template>
                    个人中心
                  </a-menu-item>
                  <a-menu-item key="logout">
                    <template #icon><icon-export /></template>
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
              <div className="user-info">
                <a-avatar :size="32">
                  <img :src="getAvatarUrl(userStore.userProfile?.avatar)" alt="" />
                  {{ userStore.userInfo?.username?.charAt(0).toUpperCase() }}
                </a-avatar>
                <span className="username">{{ userStore.userInfo?.username }}</span>
              </div>
            </a-dropdown>
          </div>
        </a-layout-header>

        <a-layout-content class="layout-content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Layout, Menu, vatar, Dropdown, Breadcrumb, Message, Modal } from '@arco-design/web-vue'
import {
  IconApps,
  IconHome,
  IconUser,
  IconFile,
  IconSettings,
  IconExport,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/file'

import './AdminLayout.css'

const { Sider, Header, Content } = Layout

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.isAdmin)

const handleMenuClick = (key: string) => {
  router.push(key)
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/admin/profile')
      break
    case 'logout':
      Modal.confirm({
        title: '提示',
        content: '确定要退出登录吗？',
        onOk: async () => {
          await userStore.logout()
          router.push('/login')
          Message.success('已退出登录')
        },
      })
      break
  }
}

const menuItems = computed(() => [
  { key: '/', icon: IconHome, label: '返回首页' },
  ...(isAdmin.value ? [{ key: '/admin/users', icon: IconUser, label: '用户管理' }] : []),
  { key: '/admin/posts', icon: IconFile, label: '博文管理' },
  { key: '/admin/audit', icon: IconFile, label: '博文审核' },
  { key: '/admin/post-monitor', icon: IconFile, label: '博文数据监控' },
  { key: '/admin/profile', icon: IconUser, label: '个人中心' },
  ...(isAdmin.value ? [{ key: '/admin/logs', icon: IconFile, label: '系统日志' }] : []),
  ...(isAdmin.value ? [{ key: '/admin/settings', icon: IconSettings, label: '系统设置' }] : []),
])

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

const breadcrumbItems = computed(() => {
  return route.path
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/')
      return { path, label: pathLabels[segment] || segment }
    })
})
</script>
