<template>
  <div class="user-profile">
    <el-card class="profile-header">
      <div class="profile-main">
        <div class="profile-avatar">
          <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :http-request="handleUploadAvatar"
              :before-upload="beforeAvatarUpload"
          >
            <el-avatar
                v-if="userStore.userProfile?.avatar"
                :size="120"
                :src="getAvatarUrl(userStore.userProfile.avatar)"
            />
            <el-avatar v-else :size="120">
              {{ userStore.userInfo?.username?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="avatar-overlay">
              <el-icon :size="24">
                <Camera/>
              </el-icon>
              <p>点击更换</p>
            </div>
          </el-upload>
        </div>

        <div class="profile-info">
          <div class="profile-basic">
            <h2 class="profile-username">{{ userStore.userInfo?.username }}</h2>
            <div class="profile-stats">
              <div class="stat-item" @click="showFollowingList()">
                <span class="stat-number">{{ userStats.followingCount }}</span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item" @click="showFollowerList()">
                <span class="stat-number">{{ userStats.followerCount }}</span>
                <span class="stat-label">粉丝</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ postCount }}</span>
                <span class="stat-label">文章</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="main-content-card">
      <el-tabs v-model="activeMainTab" class="main-tabs">
    
        <el-tab-pane label="我的文章" name="posts">
          <MyPosts @post-count-change="postCount = $event"/>
        </el-tab-pane>
    
        <el-tab-pane label="我的收藏" name="collects">
          <UserCollectList :user-id="userStore.userInfo?.id" :is-owner="true" />
        </el-tab-pane>
        
        <el-tab-pane label="设置" name="settings">
          <div class="settings-container">
            <el-tabs v-model="editActiveTab" tab-position="left" class="settings-tabs">
              <el-tab-pane label="基本信息" name="basic">
                <div class="settings-content">
                  <div class="settings-header">
                    <h3>基本信息</h3>
                    <p>管理您的个人信息，包括姓名、联系方式等</p>
                  </div>
                  <BasicInfo
                    :username="userStore.userInfo?.username"
                    :initial-data="basicForm"
                    :loading="updating"
                    @save="handleUpdateBasic"
                  />
                </div>
              </el-tab-pane>

              <el-tab-pane label="账号安全" name="security">
                <div class="settings-content">
                  <div class="settings-header">
                    <h3>账号安全</h3>
                    <p>保护您的账号安全，修改密码或进行账号注销</p>
                  </div>
                  <SecuritySettings
                    ref="securitySettingsRef"
                    :loading="changingPassword"
                    @change-password="handleChangePassword"
                    @delete-account="handleDeleteAccount"
                  />
                </div>
              </el-tab-pane>

              <el-tab-pane label="登录历史" name="login-history">
                <div class="settings-content">
                  <div class="settings-header">
                    <h3>登录历史</h3>
                    <p>查看您最近的账号登录活动</p>
                  </div>
                  <LoginHistory :history="loginHistory" />
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
        v-model="showFollowingDialog"
        title="我的关注"
        width="600px"
        destroy-on-close
    >
      <UserList
          :users="followingUsers"
          @close="showFollowingDialog = false"
      />
    </el-dialog>

    <el-dialog
        v-model="showFollowerDialog"
        title="我的粉丝"
        width="600px"
        destroy-on-close
    >
      <UserList
          :users="followerUsers"
          @close="showFollowerDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import { useUserStore} from '@/stores/user'
import * as userApi from '@/api/user/user.ts'
import * as userProfileApi from '@/api/user/userProfile.ts'
import * as userFollowApi from '@/api/user/userFollow.ts'
import { getAvatarUrl } from '@/utils/file'
import { getLocationFromIp } from '@/utils/ipLocation'
import type { UserProfileVO } from '@/models/vo/user'
import UserList from '../../components/user/UserList.vue'

import MyPosts from '@/components/user/MyPosts.vue'
import UserCollectList from '@/components/user/UserCollectList.vue'
import BasicInfo from '@/components/profile/BasicInfo.vue'
import SecuritySettings from '@/components/profile/SecuritySettings.vue'
import LoginHistory from '@/components/profile/LoginHistory.vue'

/* --- 工具方法 --- */
function genderToNum(g?: string): 1 | 0 {
  return g === 'FEMALE' ? 0 : 1
}

function numToGender(n: 1 | 0): 'MALE' | 'FEMALE' {
  return n === 0 ? 'FEMALE' : 'MALE'
}
/* --- 基础状态 --- */
const userStore = useUserStore()
const activeMainTab = ref('posts')
const editActiveTab = ref('basic')
const showFollowingDialog = ref(false)
const showFollowerDialog = ref(false)
const updating = ref(false)
const changingPassword = ref(false)
const securitySettingsRef = ref()

/* --- 数据存储 --- */
const userStats = reactive({followingCount: 0, followerCount: 0})
const postCount = ref(0)

// 关注和粉丝的用户列表，传给 UserList 组件
const followingUsers = ref<UserProfileVO[]>([])
const followerUsers = ref<UserProfileVO[]>([])

const basicForm = reactive({realName: '', gender: 1 as 1 | 0, birthday: '', phone: '', email: ''})

/* --- 数据加载逻辑 --- */
const loadUserStats = async () => {
  if (!userStore.userInfo?.id) return
  const res = await userFollowApi.getUserFollowStats(userStore.userInfo.id)
  if (res.code === 200) {
    userStats.followingCount = res.data.followingCount
    userStats.followerCount = res.data.followerCount
  }
}

/* --- 关注/粉丝列表逻辑 (一致化处理) --- */
const showFollowingList = async () => {
  if (!userStore.userInfo?.id) return
  const res = await userFollowApi.listFollowingUsers(userStore.userInfo.id, 1, 50)
  if (res.code === 200) {
    followingUsers.value = res.data.rows
    showFollowingDialog.value = true
  }
}

const showFollowerList = async () => {
  if (!userStore.userInfo?.id) return
  const res = await userFollowApi.listFollowerUsers(userStore.userInfo.id, 1, 50)
  if (res.code === 200) {
    followerUsers.value = res.data.rows
    showFollowerDialog.value = true
  }
}

/* --- 操作方法 --- */
const handleUpdateBasic = async (formData: any) => {
  updating.value = true
  try {
    await userStore.updateProfile({
      realName: formData.realName,
      gender: numToGender(formData.gender),
      birthday: formData.birthday ? formData.birthday + 'T00:00:00' : undefined,
      avatar: userStore.userProfile?.avatar
    })
    if (userStore.userInfo?.id) {
      await userApi.updateUser(userStore.userInfo.id, {phone: formData.phone, email: formData.email})
    }
    await userStore.fetchUserInfo()
    ElMessage.success('更新成功')
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    updating.value = false
  }
}

const handleChangePassword = async (pwdData: any) => {
  changingPassword.value = true
  try {
    const res = await userStore.changePassword(pwdData.oldPassword, pwdData.newPassword)
    if (res.success) {
      ElMessage.success('密码修改成功')
      securitySettingsRef.value?.resetPasswordForm()
    } else ElMessage.error(res.message)
  } finally {
    changingPassword.value = false
  }
}

const handleDeleteAccount = async () => {
  try {
    await ElMessageBox.confirm('确定注销账号吗？这是不可逆的操作！', '警告', {type: 'error'})
    const {value} = await ElMessageBox.prompt('请输入 "DELETE" 确认', '二次确认')
    if (value === 'DELETE') {
      const res = await userStore.deleteAccount()
      if (res.success) ElMessage.success('注销成功')
    }
  } catch (e) {
  }
}

const handleUploadAvatar = async (options: any) => {
  try {
    const res = await userProfileApi.uploadAvatar(options.file)
    if (res.code === 200) {
      ElMessage.success('头像上传成功')
      if (userStore.userProfile) {
        userStore.userProfile.avatar = res.data
      }
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败')
  }
}

const beforeAvatarUpload = (file: File) => {
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) ElMessage.error('大小不能超过 2MB!')
  return isLt2M
}

const loginHistory = ref<any[]>([])

const loadLoginHistory = async () => {
  if (userStore.userInfo?.lastLoginAt) {
    try {
      const ipAddress = userStore.userInfo.lastLoginIp || 'Unknown'
      let location = 'Unknown'

      if (ipAddress !== 'Unknown') {
        location = await getLocationFromIp(ipAddress)
      }

      loginHistory.value = [{
        loginTime: userStore.userInfo.lastLoginAt.replace('T', ' ').substring(0, 19),
        ipAddress: ipAddress,
        location: location,
        device: userStore.userInfo.lastLoginDevice || 'Unknown'
      }]
    } catch (error) {
      console.error('Failed to load login history:', error)
      loginHistory.value = [{
        loginTime: userStore.userInfo.lastLoginAt.replace('T', ' ').substring(0, 19),
        ipAddress: 'Unknown',
        location: 'Unknown',
        device: 'Unknown'
      }]
    }
  } else {
    loginHistory.value = []
  }
}

onMounted(() => {
  if (userStore.userProfile) {
    Object.assign(basicForm, {
      realName: userStore.userProfile.realName || '',
      gender: genderToNum(userStore.userProfile.gender),
      birthday: userStore.userProfile.birthday?.slice(0, 10) || '',
      phone: userStore.userProfile.phone || '',
      email: userStore.userProfile.email || ''
    })
  }
  loadUserStats()
  loadLoginHistory()
})

</script>

<style scoped>
.user-profile {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-header, .main-content-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 20px;
}

.avatar-uploader {
  position: relative;
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: 0.3s;
}

.avatar-uploader:hover .avatar-overlay {
  opacity: 1;
}

.profile-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-username {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
}

.profile-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
  cursor: pointer;
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: 600;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.main-tabs {
  padding: 0 10px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  height: 55px;
}

.settings-container {
  min-height: 400px;
  padding: 20px 0;
}

.settings-tabs {
  height: 100%;
}

:deep(.settings-tabs .el-tabs__header.is-left) {
  margin-right: 30px;
  width: 160px;
  border-right: 1px solid var(--el-border-color-light);
}

:deep(.settings-tabs .el-tabs__item.is-left) {
  text-align: left;
  height: 45px;
  line-height: 45px;
  font-size: 15px;
  padding: 0 20px;
}

.settings-content {
  padding-left: 10px;
}

.settings-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.settings-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.settings-header p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>