import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserVO, UserProfileVO } from '@/models/vo/user'
import * as authApi from '@/api/auth/auth'
import * as userProfileApi from '@/api/user/userProfile'

interface UserState {
  token: string
  userInfo: UserVO | null
  userProfile: UserProfileVO | null

  isAuthenticated: boolean
  isAdmin: boolean
  isModerator: boolean
  isAuditor: boolean
  isBackendUser: boolean

  setToken: (token: string) => void
  clearToken: () => void
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (data: { username: string; password: string; phone?: string; email?: string }) => Promise<{ success: boolean; message?: string }>
  fetchUserInfo: () => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string }>
  deleteAccount: () => Promise<{ success: boolean; message?: string }>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      token: localStorage.getItem('token') || '',
      userInfo: null,
      userProfile: null,

      get isAuthenticated() {
        return !!get().token
      },
      get isAdmin() {
        return get().userInfo?.roles.includes('ROLE_ADMIN') || false
      },
      get isModerator() {
        return get().userInfo?.roles.includes('ROLE_MODERATOR') || false
      },
      get isAuditor() {
        return get().userInfo?.roles.includes('ROLE_MODERATOR') || false
      },
      get isBackendUser() {
        return get().isAdmin || get().isAuditor
      },

      setToken: (token: string) => {
        set({ token })
        localStorage.setItem('token', token)
      },

      clearToken: () => {
        set({ token: '' })
        localStorage.removeItem('token')
      },

      login: async (username: string, password: string) => {
        try {
          const res = await authApi.login({ username, password })
          if (res.code === 200 && res.data) {
            get().setToken(res.data)
            await get().fetchUserInfo()
            return { success: true }
          }
          return { success: false, message: res.message }
        } catch (error: any) {
          return { success: false, message: error.message || '登录失败' }
        }
      },

      register: async (data) => {
        try {
          const res = await authApi.register(data)
          if (res.code === 200 && res.data) {
            set({ userInfo: res.data })
            return { success: true }
          }
          return { success: false, message: res.message }
        } catch (error: any) {
          return { success: false, message: error.message || '注册失败' }
        }
      },

      fetchUserInfo: async () => {
        try {
          const userRes = await authApi.getCurrentUser()
          if (userRes.code !== 200) {
            return { success: false, message: '获取用户信息失败' }
          }
          set({ userInfo: userRes.data })

          try {
            const profileRes = await userProfileApi.getCurrentUserProfile()
            if (profileRes.code === 200) {
              set({ userProfile: profileRes.data })
            }
          } catch (profileError) {
            console.warn('获取用户资料失败，可能用户资料尚未创建:', profileError)
          }

          return { success: true }
        } catch (error: any) {
          return { success: false, message: error.message || '获取用户信息失败' }
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          get().clearToken()
          set({ userInfo: null, userProfile: null })
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        try {
          const res = await authApi.changePassword({ oldPassword, newPassword })
          if (res.code === 200) {
            return { success: true }
          }
          return { success: false, message: res.message }
        } catch (error: any) {
          return { success: false, message: error.message || '修改密码失败' }
        }
      },

      updateProfile: async (data: any) => {
        try {
          const res = await userProfileApi.updateUserProfile(data)
          if (res.code === 200) {
            set({ userProfile: res.data })
            return { success: true }
          }
          return { success: false, message: res.message }
        } catch (error: any) {
          return { success: false, message: error.message || '更新资料失败' }
        }
      },

      deleteAccount: async () => {
        try {
          const res = await authApi.deleteAccount()
          if (res.code === 200) {
            await get().logout()
            return { success: true }
          }
          return { success: false, message: res.message }
        } catch (error: any) {
          return { success: false, message: error.message || '注销账号失败' }
        }
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
