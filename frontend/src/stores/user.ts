import { defineStore } from 'pinia'
import type { UserVO, UserProfileVO } from '@/models/vo/user'
import * as authApi from '@/api/auth/auth'
import * as userProfileApi from '@/api/user/userProfile'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserVO | null>(null)
  const userProfile = ref<UserProfileVO | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.roles.includes('ROLE_ADMIN') || false)
  const isModerator = computed(() => userInfo.value?.roles.includes('ROLE_MODERATOR') || false)
  const isAuditor = computed(() => userInfo.value?.roles.includes('ROLE_MODERATOR') || false)
  const isBackendUser = computed(() => isAdmin.value || isAuditor.value)

  function setToken(value: string) {
    token.value = value
    localStorage.setItem('token', value)
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem('token')
  }

  async function login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authApi.login({ username, password })
      if (res.code === 200 && res.data) {
        setToken(res.data)
        await fetchUserInfo()
        return { success: true }
      }
      return { success: false, message: res.message }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' }
    }
  }

  async function register(data: { username: string; password: string; phone?: string; email?: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authApi.register(data)
      if (res.code === 200 && res.data) {
        userInfo.value = res.data
        return { success: true }
      }
      return { success: false, message: res.message }
    } catch (error: any) {
      return { success: false, message: error.message || '注册失败' }
    }
  }

  async function fetchUserInfo(): Promise<{ success: boolean; message?: string }> {
    try {
      const userRes = await authApi.getCurrentUser()
      if (userRes.code !== 200) {
        return { success: false, message: '获取用户信息失败' }
      }
      userInfo.value = userRes.data

      try {
        const profileRes = await userProfileApi.getCurrentUserProfile()
        if (profileRes.code === 200) {
          userProfile.value = profileRes.data
        }
      } catch (profileError) {
        console.warn('获取用户资料失败，可能用户资料尚未创建:', profileError)
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.message || '获取用户信息失败' }
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearToken()
      userInfo.value = null
      userProfile.value = null
    }
  }

  async function changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authApi.changePassword({ oldPassword, newPassword })
      if (res.code === 200) {
        return { success: true }
      }
      return { success: false, message: res.message }
    } catch (error: any) {
      return { success: false, message: error.message || '修改密码失败' }
    }
  }

  async function updateProfile(data: any): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await userProfileApi.updateUserProfile(data)
      if (res.code === 200) {
        userProfile.value = res.data
        return { success: true }
      }
      return { success: false, message: res.message }
    } catch (error: any) {
      return { success: false, message: error.message || '更新资料失败' }
    }
  }

  async function deleteAccount(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await authApi.deleteAccount()
      if (res.code === 200) {
        await logout()
        return { success: true }
      }
      return { success: false, message: res.message }
    } catch (error: any) {
      return { success: false, message: error.message || '注销账号失败' }
    }
  }

  return {
    token,
    userInfo,
    userProfile,
    isAuthenticated,
    isAdmin,
    isModerator,
    isAuditor,
    isBackendUser,
    setToken,
    clearToken,
    login,
    register,
    fetchUserInfo,
    logout,
    changePassword,
    updateProfile,
    deleteAccount,
  }
}, {
  persist: {
    key: 'user-store',
  },
})
