import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import '@arco-design/web-vue/dist/arco.css'

import App from './App.vue'
import HomeLayout from './layouts/HomeLayout.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import Login from './views/auth/Login.vue'
import Register from './views/auth/Register.vue'
import Home from './views/Home.vue'
import FollowingPosts from './views/post/FollowingPosts.vue'
import MessageList from './views/message/MessageList.vue'
import ChatView from './views/message/ChatView.vue'
import HotPosts from './views/post/HotPosts.vue'
import RecommendFeed from './views/post/RecommendFeed.vue'
import UserManagement from './views/admin/UserManagement.vue'
import PostManagement from './views/admin/PostManagement.vue'
import PostMonitor from './views/admin/PostMonitor.vue'
import PostAuditList from './views/admin/PostAuditList.vue'
import UserProfile from './views/profile/UserProfile.vue'
import SystemLog from './views/admin/SystemLog.vue'
import PostList from './views/post/PostList.vue'
import PostDetail from './views/post/PostDetail.vue'
import PostEdit from './views/post/PostEdit.vue'
import PostCreate from './views/post/PostCreate.vue'
import PostAudit from './views/post/PostAudit.vue'
import UserProfilePublic from './views/profile/UserProfilePublic.vue'
import NotFound from './views/NotFound.vue'
import { useUserStore } from '@/stores/user'

import './styles/global.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: HomeLayout,
      children: [
        { path: '', name: 'Home', component: Home },
        { path: 'following', name: 'Following', component: FollowingPosts, meta: { requiresAuth: true } },
        { path: 'messages', name: 'Messages', component: MessageList, meta: { requiresAuth: true } },
        { path: 'chat/:userId', name: 'Chat', component: ChatView, meta: { requiresAuth: true } },
        { path: 'hot', name: 'Hot', component: HotPosts },
        { path: 'recommend', name: 'Recommend', component: RecommendFeed, meta: { requiresAuth: true } },
      ],
    },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: 'users', name: 'AdminUsers', component: UserManagement },
        { path: 'posts', name: 'AdminPosts', component: PostManagement },
        { path: 'post-monitor', name: 'PostMonitor', component: PostMonitor },
        { path: 'audit', name: 'AdminAudit', component: PostAuditList },
        { path: 'profile', name: 'AdminProfile', component: UserProfile },
        { path: 'logs', name: 'SystemLogs', component: SystemLog },
      ],
    },
    { path: '/profile', name: 'Profile', component: UserProfile, meta: { requiresAuth: true } },
    {
      path: '/post',
      component: HomeLayout,
      children: [
        { path: 'list', name: 'PostList', component: PostList },
        { path: ':id', name: 'PostDetail', component: PostDetail },
        { path: ':id/edit', name: 'PostEdit', component: PostEdit, meta: { requiresAuth: true } },
        { path: 'create', name: 'PostCreate', component: PostCreate, meta: { requiresAuth: true } },
        { path: ':id/audit', name: 'PostAudit', component: PostAudit, meta: { requiresAuth: true, requiresAdmin: true } },
      ],
    },
    { path: '/user/:userId', name: 'UserProfilePublic', component: UserProfilePublic, meta: { requiresAuth: true } },
    {
      path: '/',
      component: HomeLayout,
      children: [
        { path: '*', name: 'NotFound', component: NotFound },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const token = userStore.token
  const userInfo = userStore.userInfo

  if (to.meta.requiresAuth && !token) {
    alert('您尚未登录，请先登录。')
    return { name: 'Login', state: { from: to.fullPath } }
  }

  if (to.meta.requiresAuth && token && !userInfo) {
    return userStore.fetchUserInfo().then((res) => {
      if (!res.success) {
        alert('认证信息失效，请重新登录！')
        userStore.clearToken()
        return { name: 'Login', state: { from: to.fullPath } }
      }
      return true
    })
  }

  if (to.meta.requiresAdmin) {
    if (!userStore.isAdmin && !userStore.isModerator) {
      alert('您没有权限访问此页面！')
      return { name: 'Home' }
    }
  }

  return true
})

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(ArcoVue)
app.use(ArcoVueIcon)

app.mount('#app')
