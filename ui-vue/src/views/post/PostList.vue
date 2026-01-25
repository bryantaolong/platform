<template>
  <div :class="['blog-post-list-container', {'home-page': isHomePage}]">
    <!-- Header Section - Only show on home page -->
    <div v-if="isHomePage" class="header-section">
      <h1 class="blog-title">欢迎来到 Platform</h1>
      <p class="blog-subtitle">分享知识，发现精彩</p>
    </div>

    <!-- Search Section - Only show on non-home pages -->
    <div v-if="!isHomePage" class="search-section">
      <el-input
          v-model="searchForm.title"
          placeholder="搜索文章标题..."
          clearable
          style="width: 300px;"
          @input="onSearch"
      >
        <template #prefix>
          <el-icon>
            <Search/>
          </el-icon>
        </template>
      </el-input>
    </div>

    <!-- Posts Grid -->
    <div class="posts-grid" v-loading="loading">
      <div
          v-for="post in posts"
          :key="post.id"
          class="post-card"
          @click="viewPost(post.id)"
      >
        <div class="post-header">
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="post-meta">
            <span class="author">{{ post.author }}</span>
            <span class="date">{{ formatDateTime(post.createdAt) }}</span>
          </div>
        </div>
        <div class="post-content">
          <p class="post-summary">{{ post.contentPreview }}</p>
        </div>
        <div class="post-footer">
          <div class="stats">
            <span class="stat-item">
              <el-icon><View/></el-icon>
              {{ post.viewCount }}
            </span>
            <span class="stat-item">
              <el-icon><Star/></el-icon>
              {{ post.likeCount }}
            </span>
            <span class="stat-item">
              <el-icon><ChatDotRound/></el-icon>
              {{ post.commentCount }}
            </span>
          </div>
          <div class="tags" v-if="post.tags && post.tags.length">
            <el-tag
                v-for="tag in post.tags"
                :key="tag"
                size="small"
                type="info"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrapper">
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
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {ElMessage} from 'element-plus'
import {
  Search,
  View,
  Star,
  ChatDotRound
} from '@element-plus/icons-vue'
import {postApi} from '@/api/post'
import type { PostSummaryVO } from '@/models/vo/post/PostSummaryVO'

interface SearchFormData {
  title: string
}

interface PaginationData {
  currentPage: number
  pageSize: number
  total: number
}

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const posts = ref<PostSummaryVO[]>([])

// Determine if we're on the home page
const isHomePage = computed(() => route.name === 'Home' || route.path === '/')

const searchForm = reactive<SearchFormData>({
  title: ''
})

const pagination = reactive<PaginationData>({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// Load posts from API
const loadPosts = async () => {
  loading.value = true
  try {
    let response;

    // Check if there's a search query in the URL
    const urlSearchQuery = route.query.search as string;

    if (searchForm.title || urlSearchQuery) {
      // Use search API if title is provided
      response = await postApi.searchPostsByTitle(
          searchForm.title,
          pagination.currentPage,
          pagination.pageSize
      )
    } else {
      // Otherwise, use the regular API
      response = await postApi.getAllPublishedPosts(
          pagination.currentPage,
          pagination.pageSize
      )
    }

    if (response.code === 200) {
      posts.value = response.data.rows
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.message || '加载文章列表失败')
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

// Format datetime for display
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}



// Handle search
const onSearch = () => {
  pagination.currentPage = 1
  loadPosts()
}

// Handle size change
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadPosts()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page
  loadPosts()
}

// View post details
const viewPost = (postId: number) => {
  router.push(`/post/${postId}`)
}

onMounted(() => {
  // Check if there's a search query in the URL
  const urlSearchQuery = route.query.search as string;
  if (urlSearchQuery) {
    searchForm.title = urlSearchQuery;
  }
  loadPosts()
})
</script>

<style scoped>
.blog-post-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: #f8f9fa;
  min-height: calc(100vh - 140px); /* Account for header and footer */
}

/* Home page specific styles */
.blog-post-list-container.home-page {
  padding-top: 20px;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.blog-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.blog-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

.search-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.post-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e1e8ed;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-header {
  padding: 20px 20px 0 20px;
}

.post-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 15px;
}

.author {
  font-weight: 500;
}

.date {
  font-style: italic;
}

.post-content {
  padding: 0 20px;
}

.post-summary {
  color: #34495e;
  line-height: 1.6;
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  padding: 0 20px 20px 20px;
  border-top: 1px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* Responsive design */
@media (max-width: 768px) {
  .blog-post-list-container {
    padding: 20px 15px;
  }

  .blog-title {
    font-size: 2rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .post-card {
    margin: 0;
  }

  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .post-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>