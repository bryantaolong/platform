<template>
  <div class="following-posts-page">
    <div class="post-list-container">
      <el-skeleton :rows="5" animated v-if="loading" />
      
      <el-empty v-if="!loading && posts.length === 0" description="还没有关注任何用户，或关注的用户暂无动态">
        <el-button type="primary" @click="goToExplore">去发现</el-button>
      </el-empty>

      <div v-if="!loading && posts.length > 0" class="post-list">
        <el-card
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          shadow="hover"
          @click="viewPost(post.id)"
        >
          <template #header>
            <div class="post-card-header">
              <span class="author-name">{{ post.author }}</span>
              <span class="post-date">{{ formatDateTime(post.createdAt) }}</span>
            </div>
          </template>

          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <div class="post-summary" v-html="renderMarkdown(post.contentPreview)"></div>
          </div>

          <div class="post-footer">
            <div class="stats">
              <span class="stat-item">
                <el-icon><View /></el-icon> {{ post.viewCount }}
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon> {{ post.likeCount }}
              </span>
              <span class="stat-item">
                <el-icon><ChatDotRound /></el-icon> {{ post.commentCount }}
              </span>
            </div>
            <div class="tags" v-if="post.tags && post.tags.length">
              <el-tag v-for="tag in post.tags" :key="tag" size="small" type="info" round>
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrapper" v-if="!loading && posts.length > 0">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'
import { View, Star, ChatDotRound } from '@element-plus/icons-vue'
import { postApi } from '@/api/post'
import { getAvatarUrl } from '@/utils/file'
import type { PostSummaryVO } from '@/models/vo/post/PostSummaryVO'

interface PaginationData {
  currentPage: number
  pageSize: number
  total: number
}

const router = useRouter()
const loading = ref(true)
const posts = ref<PostSummaryVO[]>([])

const pagination = reactive<PaginationData>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const loadPosts = async () => {
  loading.value = true
  try {
    const response = await postApi.getFollowedUsersPosts(
        pagination.currentPage,
        pagination.pageSize
    )
    
    if (response.code === 200) {
      posts.value = response.data.rows
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.message || '加载关注文章失败')
    }
  } catch (error) {
    console.error('加载关注文章失败:', error)
    ElMessage.error('加载关注文章失败')
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const renderMarkdown = (text: string): string => {
  if (!text) return ''
  return marked.parse(text)
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadPosts()
}

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadPosts()
}

const viewPost = (postId: number) => {
  router.push(`/post/${postId}`)
}

const goToExplore = () => {
  router.push('/')
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.following-posts-page {
  width: 100%;
}

.post-list-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  cursor: pointer;
  border-radius: 8px;
  transition: box-shadow 0.3s ease-in-out;
}

.post-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #303133;
}

.post-date {
  font-size: 13px;
  color: #909399;
}

.post-content {
  padding: 0;
}

.post-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-summary {
  color: #606266;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 20px;
}

.post-summary :deep(*) {
  font-size: 14px !important;
  line-height: 1.7 !important;
  color: #606266 !important;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #909399;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
</style>