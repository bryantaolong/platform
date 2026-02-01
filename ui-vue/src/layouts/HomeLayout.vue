<template>
  <el-container class="app-layout">
    <!-- Top Navigation Bar -->
    <el-header class="top-nav">
      <div class="nav-container">
        <div class="nav-left">
          <div class="logo">
            <el-icon :size="28"><Platform /></el-icon>
            <span class="logo-text">文章平台</span>
          </div>
        </div>

        <div class="nav-center">
          <el-menu
            mode="horizontal"
            :default-active="activeMenu"
            class="top-menu"
            router
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/post/list">文章</el-menu-item>
            <el-menu-item index="/hot">热门</el-menu-item>
            <el-menu-item v-if="isLoggedIn" index="/following">关注</el-menu-item>
            <el-menu-item index="/post/create">写文章</el-menu-item>
            <el-menu-item @click="chatRef.open()">AI对话</el-menu-item>
          </el-menu>
        </div>

        <div class="nav-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章..."
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            clearable
          />

          <!-- 未登录状态 -->
          <div v-if="!isLoggedIn" class="auth-buttons">
            <el-button round @click="handleLogin">登录</el-button>
            <el-button round type="primary" @click="handleRegister">注册</el-button>
          </div>

          <!-- 已登录状态 -->
          <el-dropdown v-else trigger="hover" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="getAvatarUrl(userStore.userProfile?.avatar)">
                {{ userStore.userInfo?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.username }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="admin" v-if="isAdmin">
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- AI Chat Dialog -->
    <LlmChatDialog ref="chatRef" />

    <!-- Main Content -->
    <el-main class="main-content">
      <div class="content-wrapper">
        <router-view />
      </div>
    </el-main>

    <!-- Footer -->
    <el-footer class="footer">
      <div class="footer-content">
        <p>&copy; 2026 文章平台. All Rights Reserved.</p>
        <p>
          <a href="/about">关于我们</a> | <a href="/contact">联系我们</a> | <a href="/privacy">隐私政策</a>
        </p>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Platform,
  User,
  Setting,
  ArrowDown,
  SwitchButton,
  Search
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAvatarUrl } from '@/utils/file'
import LlmChatDialog from "@/components/llm/LlmChatDialog.vue";

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const searchQuery = ref('')

const isLoggedIn = computed(() => userStore.isAuthenticated)
const isAdmin = computed(() => userStore.isAdmin)

const chatRef = ref<ComponentPublicInstance<typeof LlmChatDialog> | null>(null)

const activeMenu = computed(() => {
  if (route.path === '/') return '/'
  if (route.path.startsWith('/hot')) return '/hot'
  if (route.path.startsWith('/following')) return '/following'
  if (route.path.startsWith('/post')) return '/post/list'
  return route.path
})

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'admin':
      router.push('/admin/users')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          type: 'warning'
        })
        await userStore.logout()
        ElMessage.success('已退出登录')
      } catch {
        // 取消退出
      }
      break
  }
}

const handleLogin = () => {
  router.push('/login')
}

const handleRegister = () => {
  router.push('/register')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ 
      path: '/post/list', 
      query: { search: searchQuery.value } 
    })
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(10px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  padding: 0;
  height: 64px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.nav-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.nav-left .logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.nav-left .logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.nav-center {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  margin: 0 40px;
}

.top-menu {
  border-bottom: none;
  background: transparent;
  --el-menu-active-color: #409eff;
}

.top-menu :deep(.el-menu-item) {
  height: 64px;
  line-height: 64px;
  font-size: 15px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.top-menu :deep(.el-menu-item.is-active) {
  border-bottom-color: var(--el-menu-active-color);
  background-color: transparent;
}

.top-menu :deep(.el-menu-item:not(.is-active):hover) {
  background-color: #f5f7fa;
  color: #409eff;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 220px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 24px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.auth-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.username {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.main-content {
  padding: 0;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

.footer {
  background-color: #ffffff;
  border-top: 1px solid #e4e7ed;
  padding: 30px 0;
  text-align: center;
  color: #909399;
}

.footer-content p {
  margin: 8px 0;
  font-size: 14px;
}

.footer-content a {
  color: #606266;
  text-decoration: none;
  margin: 0 10px;
  transition: color 0.3s;
}

.footer-content a:hover {
  color: #409eff;
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px;
  }
  
  .nav-center {
    order: 3;
    width: 100%;
    margin: 0;
    justify-content: space-around;
  }
  
  .top-menu {
    width: 100%;
  }

  .top-menu :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;
    font-size: 14px;
  }
  
  .nav-right {
    order: 2;
    flex-grow: 1;
    justify-content: flex-end;
  }
}
</style>