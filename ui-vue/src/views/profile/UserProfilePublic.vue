<template>
  <div class="user-profile-public">
    <el-card class="profile-header">
      <div class="profile-main">
        <div class="profile-avatar">
          <el-avatar :size="120" :src="userProfile?.avatar">
            {{ userProfile?.username?.charAt(0).toUpperCase() }}
          </el-avatar>
        </div>
        <div class="profile-info">
          <div class="profile-basic">
            <h2 class="profile-username">{{ userProfile?.username }}</h2>
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
          <div class="profile-actions" v-if="showFollowButton">
            <el-button
                :type="isFollowing ? 'danger' : 'primary'"
                :icon="Star"
                @click="toggleFollow"
                :loading="followLoading"
                size="large"
            >
              {{ isFollowing ? '取消关注' : '关注' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">

        <el-tab-pane label="文章" name="posts">
          <div class="tab-pane-container">
            <el-empty v-if="posts.length === 0" description="暂无文章"/>
            <div v-else class="posts-grid">
              <el-card
                  v-for="post in posts"
                  :key="post.id"
                  class="post-card"
                  @click="goToPostDetail(post.id)"
              >
                <h3 class="post-title">{{ post.title }}</h3>
                <div class="post-meta">
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                  <span class="post-stats">
                    <el-icon><View/></el-icon> {{ post.viewCount || 0 }}
                    <el-icon><ChatLineRound/></el-icon> {{ post.commentCount || 0 }}
                    <el-icon><Star/></el-icon> {{ post.likeCount || 0 }}
                  </span>
                </div>
                <div class="post-tags" v-if="post.tags && post.tags.length">
                  <el-tag
                      v-for="tag in post.tags"
                      :key="tag"
                      size="small"
                      type="info"
                      class="tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </el-card>
            </div>

            <div class="pagination-wrapper" v-if="totalPosts > pageSize">
              <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :total="totalPosts"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="收藏" name="collects">
          <UserCollectList :user-id="userId" :is-owner="false" />
        </el-tab-pane>

        <el-tab-pane label="个人信息" name="profile">
          <div class="tab-pane-container">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">{{ userProfile?.username }}</el-descriptions-item>
              <el-descriptions-item label="真实姓名">{{ userProfile?.realName || '-' }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ formatGender(userProfile?.gender) }}</el-descriptions-item>
              <el-descriptions-item label="生日">{{
                  userProfile?.birthday ? formatDate(userProfile.birthday) : '-'
                }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">{{ userProfile?.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userProfile?.email || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showFollowingDialog" title="关注列表" width="600px" destroy-on-close>
      <UserList :userIds="followingIds" @close="showFollowingDialog = false"/>
    </el-dialog>

    <el-dialog v-model="showFollowerDialog" title="粉丝列表" width="600px" destroy-on-close>
      <UserList :userIds="followerIds" @close="showFollowerDialog = false"/>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Star, View, ChatLineRound} from '@element-plus/icons-vue'
import {userApi} from '@/api/user.ts'
import {userFollowApi} from '@/api/userFollow.ts'
import {postApi} from '@/api/post.ts'
import type {UserProfileVO} from '@/models/vo/UserProfileVO.ts'
import type {PostVO} from '@/models/vo/post/PostVO.ts'
import UserList from '../../components/user/UserList.vue'
import UserCollectList from '@/components/user/UserCollectList.vue'

const route = useRoute()
const router = useRouter()
const userId = ref(Number(route.params.userId))

// UI 控制
const activeTab = ref('posts')
const isFollowing = ref(false)
const followLoading = ref(false)
const showFollowButton = ref(false)
const showFollowingDialog = ref(false)
const showFollowerDialog = ref(false)

// 数据定义
const userProfile = ref<UserProfileVO | null>(null)
const userStats = ref({followingCount: 0, followerCount: 0})
const posts = ref<PostVO[]>([])
const postCount = ref(0)
const totalPosts = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const followingIds = ref<number[]>([])
const followerIds = ref<number[]>([])

// 数据加载方法
const loadUserProfile = async () => {
  try {
    const response = await userApi.getUserProfileByUserId(userId.value)
    if (response.code === 200) {
      userProfile.value = response.data
      await loadUserStats()
      await checkFollowingStatus()
      await loadUserPosts()
    } else {
      ElMessage.error('用户不存在');
      router.push('/404')
    }
  } catch (error) {
    ElMessage.error('加载用户信息失败');
    router.push('/404')
  }
}

const loadUserStats = async () => {
  const response = await userFollowApi.getUserFollowStats(userId.value)
  if (response.code === 200) userStats.value = response.data
}

const checkFollowingStatus = async () => {
  const response = await userFollowApi.checkFollowing(userId.value)
  if (response.code === 200) {
    isFollowing.value = response.data
    showFollowButton.value = true
  }
}

const loadUserPosts = async () => {
  const response = await postApi.getPublishedPostsByUserId(userId.value, currentPage.value, pageSize.value)
  if (response.code === 200) {
    posts.value = response.data.rows
    totalPosts.value = response.data.total
    postCount.value = response.data.total
  }
}

// 事件处理

const toggleFollow = async () => {
  followLoading.value = true
  try {
    const response = isFollowing.value
        ? await userFollowApi.unfollowUser(userId.value)
        : await userFollowApi.followUser(userId.value)

    if (response.code === 200) {
      isFollowing.value = !isFollowing.value
      ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
      await loadUserStats()
    }
  } finally {
    followLoading.value = false
  }
}

const showFollowingList = async () => {
  const response = await userFollowApi.getFollowingUsers(userId.value, 1, 50)
  if (response.code === 200) {
    followingIds.value = response.data.rows.map(u => u.id);
    showFollowingDialog.value = true
  }
}

const showFollowerList = async () => {
  const response = await userFollowApi.getFollowerUsers(userId.value, 1, 50)
  if (response.code === 200) {
    followerIds.value = response.data.rows.map(u => u.id);
    showFollowerDialog.value = true
  }
}

const formatGender = (g?: string) => g === 'MALE' ? '男' : (g === 'FEMALE' ? '女' : '-')
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('zh-CN') : ''
const goToPostDetail = (id: number) => router.push(`/post/${id}`)
const handleSizeChange = (s: number) => {
  pageSize.value = s;
  loadUserPosts()
}
const handleCurrentChange = (p: number) => {
  currentPage.value = p;
  loadUserPosts()
}

onMounted(() => loadUserProfile())
</script>

<style scoped>
.user-profile-public {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

.profile-header {
  border-radius: 12px;
  margin-bottom: 20px;
}

.profile-main {
  display: flex;
  align-items: center;
  padding: 20px;
}

.profile-avatar {
  margin-right: 30px;
}

.profile-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.profile-username {
  margin: 0 0 15px 0;
  font-size: 24px;
  color: #303133;
}

.profile-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
}

.stat-item:hover {
  background-color: #f5f7fa;
}

.stat-number {
  display: block;
  font-weight: bold;
  font-size: 20px;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.profile-content {
  border-radius: 12px;
}

.tab-pane-container {
  padding: 20px 0;
}

.posts-grid, .collects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.post-card {
  cursor: pointer;
  transition: all 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 14px;
}

.post-stats {
  display: flex;
  gap: 15px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>