<template>
  <div class="user-profile">
    <el-card class="profile-header">
      <div class="profile-main">
        <div class="profile-avatar">
          <el-upload
              class="avatar-uploader"
              action="/api/upload/avatar"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
          >
            <el-avatar
                v-if="userStore.userProfile?.avatar"
                :size="120"
                :src="userStore.userProfile.avatar"
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
          <div class="profile-actions">
            <el-button type="primary" @click="showProfileDialog = true">
              <el-icon>
                <Edit/>
              </el-icon>
              编辑资料
            </el-button>
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
        
        <el-tab-pane label="详细资料" name="profile-detail">
          <div class="tab-content-container">
            <el-descriptions :column="1" border style="max-width: 800px">
              <el-descriptions-item label="用户名">{{ userStore.userInfo?.username }}</el-descriptions-item>
              <el-descriptions-item label="真实姓名">{{ userStore.userProfile?.realName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="性别">
                {{ userStore.userProfile?.gender === 'FEMALE' ? '女' : '男' }}
              </el-descriptions-item>
              <el-descriptions-item label="生日">
                {{ userStore.userProfile?.birthday ? userStore.userProfile.birthday.slice(0, 10) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">{{ userStore.userProfile?.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userStore.userProfile?.email || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showProfileDialog" title="编辑个人信息" width="650px" :close-on-click-modal="false">
      <el-tabs v-model="editActiveTab" class="info-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="100px" class="info-form">
            <el-form-item label="用户名">
              <el-input :value="userStore.userInfo?.username" disabled/>
            </el-form-item>
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="basicForm.realName" placeholder="请输入真实姓名"/>
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="basicForm.gender">
                <el-radio :label="1">男</el-radio>
                <el-radio :label="0">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="生日" prop="birthday">
              <el-date-picker v-model="basicForm.birthday" type="date" placeholder="选择生日"
                              value-format="YYYY-MM-DD"/>
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="basicForm.phone" placeholder="请输入手机号"/>
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="basicForm.email" placeholder="请输入邮箱"/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="updating" @click="handleUpdateBasic">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="账号安全" name="security">
          <div class="security-section">
            <h3>修改密码</h3>
            <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="120px">
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" show-password/>
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" show-password/>
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" show-password/>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="changingPassword" @click="handleChangePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-divider/>
          <div class="danger-section">
            <h3>危险操作</h3>
            <el-alert title="注销账号是不可逆的操作，请谨慎操作！" type="error" :closable="false" show-icon/>
            <el-button type="danger" plain style="margin-top: 16px" @click="handleDeleteAccount">注销账号</el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="登录历史" name="login-history">
          <el-table :data="loginHistory" style="width: 100%">
            <el-table-column prop="loginTime" label="登录时间" width="180"/>
            <el-table-column prop="ipAddress" label="IP地址" width="140"/>
            <el-table-column prop="location" label="登录地点"/>
            <el-table-column prop="device" label="设备信息"/>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog
        v-model="showFollowingDialog"
        title="我的关注"
        width="600px"
        destroy-on-close
    >
      <UserList
          :userIds="followingIds"
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
          :userIds="followerIds"
          @close="showFollowerDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import type {FormInstance} from 'element-plus'
import {Camera, Edit} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '@/stores/user'
import {userApi} from '@/api/user'
import {userFollowApi} from '@/api/userFollow'
import UserList from '../../components/user/UserList.vue'
import MyPosts from '@/components/user/MyPosts.vue'
import UserCollectList from '@/components/user/UserCollectList.vue'

/* --- 工具方法 --- */
function genderToNum(g?: string): 1 | 0 {
  return g === 'FEMALE' ? 0 : 1
}

function numToGender(n: 1 | 0): 'MALE' | 'FEMALE' {
  return n === 0 ? 'FEMALE' : 'MALE'
}

const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('zh-CN') : ''

/* --- 基础状态 --- */
const router = useRouter()
const userStore = useUserStore()
const activeMainTab = ref('posts')
const editActiveTab = ref('basic')
const showProfileDialog = ref(false)
const showFollowingDialog = ref(false)
const showFollowerDialog = ref(false)
const updating = ref(false)
const changingPassword = ref(false)

/* --- 数据存储 --- */
const userStats = reactive({followingCount: 0, followerCount: 0})
const postCount = ref(0)

// 关注和粉丝的 ID 列表，传给 UserList 组件
const followingIds = ref<number[]>([])
const followerIds = ref<number[]>([])

const basicFormRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const basicForm = reactive({realName: '', gender: 1 as 1 | 0, birthday: '', phone: '', email: ''})
const passwordForm = reactive({oldPassword: '', newPassword: '', confirmPassword: ''})

/* --- 校验规则 --- */
const basicRules = {
  realName: [{min: 2, max: 20, message: '真实姓名长度应在2-20个字符之间', trigger: 'blur'}],
  phone: [{
    validator: (_: any, value: string, callback: Function) => {
      if (!value) return callback()
      const pattern = /^1[3-9]\d{9}$/
      pattern.test(value) ? callback() : callback(new Error('电话号码格式不正确'))
    }, trigger: 'blur'
  }],
  email: [{type: 'email', message: '邮箱格式不正确', trigger: 'blur'}]
}
const passwordRules = {
  oldPassword: [{required: true, message: '请输入当前密码', trigger: 'blur'}],
  newPassword: [{required: true, message: '请输入新密码', trigger: 'blur'}, {
    min: 6,
    message: '至少6位',
    trigger: 'blur'
  }],
  confirmPassword: [{required: true, message: '请确认新密码', trigger: 'blur'}, {
    validator: (_: any, value: string, callback: Function) => {
      value !== passwordForm.newPassword ? callback(new Error('两次输入不一致')) : callback()
    }, trigger: 'blur'
  }]
}

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
  const res = await userFollowApi.getFollowingUsers(userStore.userInfo.id, 1, 50)
  if (res.code === 200) {
    followingIds.value = res.data.rows.map((u: any) => u.id)
    showFollowingDialog.value = true
  }
}

const showFollowerList = async () => {
  if (!userStore.userInfo?.id) return
  const res = await userFollowApi.getFollowerUsers(userStore.userInfo.id, 1, 50)
  if (res.code === 200) {
    followerIds.value = res.data.rows.map((u: any) => u.id)
    showFollowerDialog.value = true
  }
}

/* --- 操作方法 --- */
const handleUpdateBasic = async () => {
  if (!basicFormRef.value) return
  await basicFormRef.value.validate(async (valid) => {
    if (!valid) return
    updating.value = true
    try {
      await userStore.updateProfile({
        realName: basicForm.realName,
        gender: numToGender(basicForm.gender),
        birthday: basicForm.birthday ? basicForm.birthday + 'T00:00:00' : undefined,
        avatar: userStore.userProfile?.avatar
      })
      if (userStore.userInfo?.id) {
        await userApi.updateUser(userStore.userInfo.id, {phone: basicForm.phone, email: basicForm.email})
      }
      await userStore.fetchUserInfo()
      ElMessage.success('更新成功')
    } catch (e) {
      ElMessage.error('更新失败')
    } finally {
      updating.value = false
    }
  })
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    changingPassword.value = true
    try {
      const res = await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      if (res.success) {
        ElMessage.success('密码修改成功')
        passwordFormRef.value!.resetFields()
      } else ElMessage.error(res.message)
    } finally {
      changingPassword.value = false
    }
  })
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

const handleAvatarSuccess = (res: any) => {
  if (res.code === 200) {
    ElMessage.success('上传成功')
    userStore.userProfile!.avatar = res.data
  }
}

const beforeAvatarUpload = (file: File) => {
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) ElMessage.error('大小不能超过 2MB!')
  return isLt2M
}

const goToPostDetail = (id: number) => router.push(`/post/${id}`)

const loginHistory = ref([
  {loginTime: '2024-01-15 14:30:25', ipAddress: '192.168.1.100', location: '北京市', device: 'Chrome on Windows'}
])

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

.tab-content-container {
  padding: 20px 0;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.post-card {
  cursor: pointer;
  transition: 0.3s;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  height: 44px;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.info-tabs {
  padding: 0 10px;
}

.info-form {
  padding: 20px 0;
  max-width: 500px;
}

.security-section h3 {
  margin-bottom: 20px;
}

.danger-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>