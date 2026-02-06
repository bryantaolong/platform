<template>
  <div class="personalized-feed-container">
    <div class="section-header">
      <h3 class="section-title">
        <el-icon><MagicStick/></el-icon>
        为你推荐
      </h3>
      <div class="header-actions">
        <el-button
          v-if="isAuthenticated"
          type="primary"
          size="small"
          :loading="refreshing"
          @click="refreshFeed"
        >
          <el-icon><Refresh/></el-icon>
          换一批
        </el-button>
      </div>
    </div>

    <!-- 兴趣标签展示 -->
    <div v-if="showInterests && interests.length > 0" class="interest-tags">
      <span class="interest-label">你的兴趣：</span>
      <el-tag
        v-for="tag in interests.slice(0, 5)"
        :key="tag"
        size="small"
        type="info"
        effect="plain"
      >
        {{ tag }}
      </el-tag>
    </div>

    <el-skeleton v-if="loading" :rows="3" animated/>
    <el-empty
      v-else-if="posts.length === 0 && !isAuthenticated"
      description="登录后获取个性化推荐"
    >
      <template #description>
        <p>登录后我们会根据你的兴趣为你推荐内容</p>
      </template>
      <el-button type="primary" @click="$router.push('/login')">立即登录</el-button>
    </el-empty>
    <el-empty
      v-else-if="posts.length === 0 && isAuthenticated"
      description="暂无推荐内容"
    >
      <template #description>
        <p>去关注一些用户或浏览更多内容来丰富你的推荐</p>
      </template>
      <el-button type="primary" @click="goToExplore">去探索</el-button>
    </el-empty>

    <div v-else class="feed-list">
      <div
        v-for="post in posts"
        :key="post.id"
        class="feed-item"
        @click="post.id && goToPostDetail(post.id)"
      >
        <div class="feed-content">
          <h4 class="feed-title">{{ post.title }}</h4>
          <p class="feed-preview">{{ getContentPreview(post.content) }}</p>
          <div class="feed-meta">
            <span class="feed-author">
              <el-icon><User/></el-icon>
              {{ post.author || '匿名用户' }}
            </span>
            <span class="feed-stats">
              <span><el-icon><View/></el-icon> {{ post.viewCount || 0 }}</span>
              <span><el-icon><ChatLineRound/></el-icon> {{ post.commentCount || 0 }}</span>
              <span><el-icon><Star/></el-icon> {{ post.likeCount || 0 }}</span>
            </span>
          </div>
          <div v-if="post.tags && post.tags.length > 0" class="feed-tags">
            <el-tag
              v-for="tag in post.tags.slice(0, 3)"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <el-button
        v-if="!loadingMore"
        type="text"
        @click="loadMore"
      >
        加载更多
      </el-button>
      <el-icon v-else class="loading-icon"><Loading/></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { MagicStick, Refresh, User, View, ChatLineRound, Star, Loading } from '@element-plus/icons-vue'
import type { PostVO } from '@/models/vo/post/PostVO'
import {
  getPersonalizedFeed,
  getHotFeedForNewUser,
  getUserInterests,
  refreshUserProfile
} from '@/api/recommendation'

const router = useRouter()
const userStore = useUserStore()

const posts = ref<PostVO[]>([])
const interests = ref<string[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const refreshing = ref(false)
const currentPage = ref(0)
const hasMore = ref(true)
const showInterests = ref(true)

const isAuthenticated = computed(() => userStore.isAuthenticated)

const PAGE_SIZE = 10

const loadFeed = async () => {
  loading.value = true
  try {
    let res
    if (isAuthenticated.value) {
      res = await getPersonalizedFeed(currentPage.value, PAGE_SIZE)
      // 同时加载兴趣标签
      const interestRes = await getUserInterests(10)
      if (interestRes.code === 200 && interestRes.data) {
        interests.value = interestRes.data
      }
    } else {
      res = await getHotFeedForNewUser(currentPage.value, PAGE_SIZE)
    }

    if (res.code === 200 && res.data) {
      if (currentPage.value === 0) {
        posts.value = res.data as PostVO[]
      } else {
        posts.value.push(...(res.data as PostVO[]))
      }
      hasMore.value = (res.data as PostVO[]).length >= PAGE_SIZE
    }
  } catch (error) {
    console.error('获取推荐内容失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  currentPage.value++

  try {
    let res
    if (isAuthenticated.value) {
      res = await getPersonalizedFeed(currentPage.value, PAGE_SIZE)
    } else {
      res = await getHotFeedForNewUser(currentPage.value, PAGE_SIZE)
    }

    if (res.code === 200 && res.data) {
      const newPosts = res.data as PostVO[]
      posts.value.push(...newPosts)
      hasMore.value = newPosts.length >= PAGE_SIZE
    }
  } catch (error) {
    console.error('加载更多推荐失败:', error)
    currentPage.value--
  } finally {
    loadingMore.value = false
  }
}

const refreshFeed = async () => {
  refreshing.value = true
  currentPage.value = 0
  hasMore.value = true

  try {
    // 刷新用户画像
    await refreshUserProfile()
    // 重新加载推荐
    const res = await getPersonalizedFeed(0, PAGE_SIZE)
    if (res.code === 200 && res.data) {
      posts.value = res.data as PostVO[]
      hasMore.value = (res.data as PostVO[]).length >= PAGE_SIZE
    }
  } catch (error) {
    console.error('刷新推荐失败:', error)
  } finally {
    refreshing.value = false
  }
}

const getContentPreview = (content: string): string => {
  if (!content) return ''
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

const goToPostDetail = (id: number) => {
  router.push(`/post/${id}`)
}

const goToExplore = () => {
  router.push('/explore')
}

// 暴露方法给父组件
defineExpose({
  refresh: refreshFeed
})

onMounted(() => {
  loadFeed()
})
</script>

<style scoped>
.personalized-feed-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.interest-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.interest-label {
  font-size: 13px;
  color: #909399;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.feed-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.feed-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.feed-preview {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.feed-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.feed-author {
  display: flex;
  align-items: center;
  gap: 4px;
}

.feed-stats {
  display: flex;
  gap: 12px;
}

.feed-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.feed-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.load-more {
  text-align: center;
  margin-top: 16px;
}

.loading-icon {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
