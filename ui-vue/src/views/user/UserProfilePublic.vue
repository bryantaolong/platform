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
          <div class="posts-container">
            <el-empty v-if="posts.length === 0" description="暂无文章" />
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
                    <el-icon><View /></el-icon> {{ post.viewCount || 0 }}
                    <el-icon><ChatLineRound /></el-icon> {{ post.commentCount || 0 }}
                    <el-icon><Star /></el-icon> {{ post.likeCount || 0 }}
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
          <div class="collects-container">
            <el-empty v-if="collects.length === 0" description="暂无收藏" />
            <div v-else class="collects-grid">
              <el-card 
                v-for="collect in collects" 
                :key="collect.id" 
                class="collect-card"
                @click="goToPostDetail(collect.postId)"
              >
                <h3 class="collect-title">{{ collect.postTitle }}</h3>
                <div class="collect-meta">
                  <span class="collect-date">{{ formatDate(collect.createdAt) }}</span>
                </div>
              </el-card>
            </div>
            
            <div class="pagination-wrapper" v-if="totalCollects > collectPageSize">
              <el-pagination
                v-model:current-page="collectCurrentPage"
                v-model:page-size="collectPageSize"
                :total="totalCollects"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleCollectSizeChange"
                @current-change="handleCollectCurrentChange"
              />
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="个人信息" name="profile">
          <div class="profile-details">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">
                {{ userProfile?.username }}
              </el-descriptions-item>
              <el-descriptions-item label="真实姓名">
                {{ userProfile?.realName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="性别">
                {{ formatGender(userProfile?.gender) }}
              </el-descriptions-item>
              <el-descriptions-item label="生日">
                {{ userProfile?.birthday ? formatDate(userProfile.birthday) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="手机号">
                {{ userProfile?.phone || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ userProfile?.email || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- Following List Dialog -->
    <el-dialog
      v-model="showFollowingDialog"
      title="关注列表"
      width="600px"
      destroy-on-close
    >
      <UserList 
        :userIds="followingIds" 
        @close="showFollowingDialog = false" 
      />
    </el-dialog>

    <!-- Follower List Dialog -->
    <el-dialog
      v-model="showFollowerDialog"
      title="粉丝列表"
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, View, ChatLineRound } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { userFollowApi } from '@/api/userFollow'
import { postApi } from '@/api/post'
import type { UserProfileVO } from '@/models/vo/UserProfileVO'
import type { PostVO } from '@/models/vo/post/PostVO'
import UserList from './UserList.vue' // We'll create this component

interface UserStats {
  followingCount: number
  followerCount: number
}

const route = useRoute()
const router = useRouter()
const userId = ref(Number(route.params.userId))

const userProfile = ref<UserProfileVO | null>(null)
const userStats = ref<UserStats>({ followingCount: 0, followerCount: 0 })
const posts = ref<PostVO[]>([])
const postCount = ref(0)
const totalPosts = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const collects = ref<any[]>([])
const totalCollects = ref(0)
const collectCurrentPage = ref(1)
const collectPageSize = ref(10)
const activeTab = ref('posts')
const isFollowing = ref(false)
const followLoading = ref(false)
const showFollowButton = ref(false) // Don't show follow button for own profile
const showFollowingDialog = ref(false)
const showFollowerDialog = ref(false)
const followingIds = ref<number[]>([])
const followerIds = ref<number[]>([])

// Load user profile
const loadUserProfile = async () => {
  try {
    const response = await userApi.getUserProfileByUserId(userId.value)
    if (response.code === 200) {
      userProfile.value = response.data
      await loadUserStats()
      await checkFollowingStatus()
      await loadUserPosts()
    } else {
      ElMessage.error('用户不存在')
      router.push('/404')
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error('加载用户信息失败')
    router.push('/404')
  }
}

// Load user stats
const loadUserStats = async () => {
  try {
    const response = await userFollowApi.getUserFollowStats(userId.value)
    if (response.code === 200) {
      userStats.value = {
        followingCount: response.data.followingCount,
        followerCount: response.data.followerCount
      }
    }
  } catch (error) {
    console.error('加载用户统计数据失败:', error)
  }
}

// Check if current user is following this user
const checkFollowingStatus = async () => {
  try {
    if (userId.value) { // Only check if not viewing own profile
      const response = await userFollowApi.checkFollowing(userId.value)
      if (response.code === 200) {
        isFollowing.value = response.data
        showFollowButton.value = true
      }
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

// Load user posts
const loadUserPosts = async () => {
  try {
    const response = await postApi.getPostsByUserId(userId.value, currentPage.value, pageSize.value)
    if (response.code === 200) {
      posts.value = response.data.rows
      totalPosts.value = response.data.total
      postCount.value = response.data.total
    }
  } catch (error) {
    console.error('加载用户文章失败:', error)
    ElMessage.error('加载文章失败')
  }
}

// Load user collects
const loadUserCollects = async () => {
  try {
    const response = await postApi.getUserCollects(collectCurrentPage.value, collectPageSize.value)
    if (response.code === 200) {
      collects.value = response.data.rows
      totalCollects.value = response.data.total
    }
  } catch (error) {
    console.error('加载用户收藏失败:', error)
    ElMessage.error('加载收藏失败')
  }
}

// Toggle follow/unfollow
const toggleFollow = async () => {
  followLoading.value = true
  try {
    let response
    if (isFollowing.value) {
      response = await userFollowApi.unfollowUser(userId.value)
    } else {
      response = await userFollowApi.followUser(userId.value)
    }
    
    if (response && response.code === 200 && response.data) {
      isFollowing.value = !isFollowing.value
      ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
      await loadUserStats() // Refresh stats
    } else {
      ElMessage.error(response?.message || (isFollowing.value ? '取消关注失败' : '关注失败'))
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

// Show following list dialog
const showFollowingList = async () => {
  try {
    const response = await userFollowApi.getFollowingUsers(userId.value, 1, 50)
    if (response.code === 200) {
      followingIds.value = response.data.rows.map(user => user.id)
      showFollowingDialog.value = true
    }
  } catch (error) {
    console.error('加载关注列表失败:', error)
    ElMessage.error('加载关注列表失败')
  }
}

// Show follower list dialog
const showFollowerList = async () => {
  try {
    const response = await userFollowApi.getFollowerUsers(userId.value, 1, 50)
    if (response.code === 200) {
      followerIds.value = response.data.rows.map(user => user.id)
      showFollowerDialog.value = true
    }
  } catch (error) {
    console.error('加载粉丝列表失败:', error)
    ElMessage.error('加载粉丝列表失败')
  }
}

// Format gender
const formatGender = (gender: string | undefined) => {
  if (!gender) return '-'
  return gender === 'MALE' ? '男' : '女'
}

// Format date
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// Go to post detail
const goToPostDetail = (postId: number) => {
  router.push(`/post/${postId}`)
}

// Handle page size change
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUserPosts()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadUserPosts()
}

// Handle collect page size change
const handleCollectSizeChange = (size: number) => {
  collectPageSize.value = size
  collectCurrentPage.value = 1
  loadUserCollects()
}

// Handle collect current page change
const handleCollectCurrentChange = (page: number) => {
  collectCurrentPage.value = page
  loadUserCollects()
}

// Watch active tab to load data
watch(activeTab, (newTab) => {
  if (newTab === 'collects') {
    loadUserCollects()
  }
})

onMounted(() => {
  loadUserProfile()
})
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
  overflow: hidden;
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

.profile-basic {
  flex: 1;
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
  transition: background-color 0.2s;
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

.profile-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-content {
  border-radius: 12px;
}

.profile-tabs {
  :deep(.el-tabs__item) {
    font-size: 16px;
  }
}

.posts-container {
  padding: 20px 0;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.post-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
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
  margin-bottom: 10px;
}

.post-stats {
  display: flex;
  gap: 15px;
}

.post-stats .el-icon {
  vertical-align: middle;
  margin-right: 2px;
}

.post-summary {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 10px;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  margin-bottom: 5px;
}

.collects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.collect-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.collect-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.collect-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
  line-height: 1.4;
}

.collect-meta {
  color: #909399;
  font-size: 14px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.profile-details {
  padding: 20px 0;
}
</style>