<template>
  <div className="app-layout">
    <header className="top-nav">
      <div className="nav-container">
        <div className="nav-left">
          <div className="logo" @click="goHome">
            <icon-apps style="font-size: 28px" />
            <span className="logo-text">Platform</span>
          </div>
        </div>

        <div className="nav-center">
          <a-menu
            mode="horizontal"
            :selected-keys="[activeMenu]"
            @menu-item-click="handleMenuClick"
            class="top-menu"
          >
            <a-menu-item v-for="item in menuItems" :key="item.key">
              {{ item.label }}
              <a-badge
                v-if="item.key === '/messages' && unreadCount > 0"
                :count="unreadCount > 99 ? '99+' : unreadCount"
                class="menu-badge"
              />
            </a-menu-item>
          </a-menu>
        </div>

        <div className="nav-right">
          <a-input
            v-model="searchQuery"
            placeholder="搜索文章..."
            allowClear
            class="search-input"
            @press-enter="handleSearch"
          >
            <template #prefix><icon-search /></template>
          </a-input>

          <template v-if="!isLoggedIn">
            <div className="auth-buttons">
              <a-button shape="round" @click="goLogin">登录</a-button>
              <a-button shape="round" type="primary" @click="goRegister">注册</a-button>
            </div>
          </template>
          <template v-else>
            <a-dropdown trigger="hover">
              <template #content>
                <a-menu @menu-item-click="handleUserCommand">
                  <a-menu-item key="profile">
                    <template #icon><icon-user /></template>
                    个人中心
                  </a-menu-item>
                  <a-menu-item v-if="isAdmin || isModerator" key="admin">
                    <template #icon><icon-settings /></template>
                    管理后台
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
          </template>
        </div>
      </div>
    </header>

    <LlmChatDialog v-model:visible="chatVisible" @close="chatVisible = false" />

    <main className="main-content">
      <div className="content-wrapper">
        <router-view />
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Menu,
  Input,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Message,
  Modal,
} from '@arco-design/web-vue'
import {
  IconApps,
  IconUser,
  IconSettings,
  IconExport,
  IconSearch,
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/file'
import { getUnreadCount } from '@/api/user/userMessage'
import LlmChatDialog from '@/components/llm/LlmChatDialog.vue'
import './HomeLayout.css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchQuery = ref('')
const unreadCount = ref(0)
const chatVisible = ref(false)

const isLoggedIn = computed(() => userStore.isAuthenticated)
const isAdmin = computed(() => userStore.isAdmin)
const isModerator = computed(() => userStore.isModerator)

const loadUnreadCount = async () => {
  if (!userStore.isAuthenticated) return
  try {
    const response = await getUnreadCount()
    if (response.code === 200) {
      unreadCount.value = response.data
    }
  } catch (error) {
    console.error('获取未读消息数失败', error)
  }
}

onMounted(() => {
  if (userStore.isAuthenticated) {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 15000)
    onUnmounted(() => clearInterval(interval))
  }
})

const activeMenu = computed(() => {
  if (route.path === '/') return '/'
  if (route.path.startsWith('/hot')) return '/hot'
  if (route.path.startsWith('/recommend')) return '/recommend'
  if (route.path.startsWith('/following')) return '/following'
  if (route.path.startsWith('/messages') || route.path.startsWith('/chat')) return '/messages'
  if (route.path.startsWith('/post')) return '/post/list'
  return route.path
})

const handleMenuClick = (key: string) => {
  if (key === 'ai-chat') {
    chatVisible.value = true
  } else {
    router.push(key)
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/post/list?search=${encodeURIComponent(searchQuery.value)}`)
  }
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'admin':
      if (isAdmin.value) {
        router.push('/admin/users')
      } else if (isModerator.value) {
        router.push('/admin/post-monitor')
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

const menuItems = computed(() => [
  { key: '/', label: '首页' },
  { key: '/post/list', label: '文章' },
  { key: '/hot', label: '热门' },
  ...(isLoggedIn.value ? [{ key: '/recommend', label: '推荐' }] : []),
  ...(isLoggedIn.value ? [{ key: '/following', label: '关注' }] : []),
  ...(isLoggedIn.value ? [{ key: '/messages', label: '消息' }] : []),
  { key: '/post/create', label: '写文章' },
  { key: 'ai-chat', label: 'AI对话' },
])

const goHome = () => {
  router.push('/')
}

const goLogin = () => {
  router.push('/login')
}

const goRegister = () => {
  router.push('/register')
}
</script>
