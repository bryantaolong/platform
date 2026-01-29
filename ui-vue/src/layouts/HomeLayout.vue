<template>
  <div class="article-layout">
    <!-- Top Navigation Bar -->
    <el-header class="top-nav">
      <div class="nav-container">
        <div class="nav-left">
          <div class="logo">
            <el-icon :size="24"><Platform /></el-icon>
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
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <el-icon @click="handleSearch"><Search /></el-icon>
            </template>
          </el-input>
          
          <!-- 未登录状态 -->
          <div v-if="!isLoggedIn" class="auth-buttons">
            <el-button @click="handleLogin">登录</el-button>
            <el-button type="primary" @click="handleRegister">注册</el-button>
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
      <router-view />
    </el-main>

    <!-- Footer -->
    <el-footer class="footer">
      <div class="footer-content">
        <p>&copy; 2026 文章平台. 保留所有权利.</p>
      </div>
    </el-footer>
  </div>
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
.article-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 60px;
  display: flex;
  align-items: center;
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
}

.nav-left .logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.nav-center {
  flex: 1;
  margin: 0 40px;
}

.top-menu {
  border-bottom: none;
  background: transparent;
}

.top-menu :deep(.el-menu-item) {
  height: 60px;
  line-height: 60px;
  border-bottom: 3px solid transparent;
}

.top-menu :deep(.el-menu-item.is-active) {
  border-bottom-color: #409eff;
  background-color: transparent;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-input {
  width: 240px;
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
  border-radius: 20px;
  transition: all 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.auth-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.auth-buttons .el-button {
  border-radius: 20px;
  padding: 8px 20px;
}

.username {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 0;
  background: #f8f9fa;
}

.footer {
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  padding: 20px 0;
  text-align: center;
}

.footer-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 15px;
    padding: 10px;
  }
  
  .nav-center {
    margin: 0;
    order: 3;
  }
  
  .nav-right {
    order: 2;
    justify-content: center;
    gap: 10px;
  }
  
  .search-input {
    width: 200px;
  }
  
  .auth-buttons {
    gap: 8px;
  }
  
  .auth-buttons .el-button {
    padding: 6px 16px;
    font-size: 12px;
  }
}
</style>