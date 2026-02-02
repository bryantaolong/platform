<template>
  <div class="hot-posts-page">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><TrendCharts/></el-icon>
        热门文章
      </h1>
      <p class="page-subtitle">发现最受欢迎的精彩内容</p>
    </div>

    <div class="hot-content">
      <el-row :gutter="24">
        <el-col :xs="24" :sm="16" :md="16" :lg="17">
          <div class="hot-list-container" v-loading="loading">
            <el-empty v-if="!loading && hotPosts.length === 0" description="暂无热门文章"/>

            <div v-else class="hot-list">
              <div
                  v-for="(post, index) in hotPosts"
                  :key="post.id"
                  class="hot-post-card"
                  @click="viewPost(post.id)"
              >
                <div class="rank-badge" :class="getRankClass(index)">
                  {{ index + 1 }}
                </div>
                <div class="post-content">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <div class="post-preview markdown-preview" v-html="renderMarkdown(getContentPreview(post.content))"></div>
                  <div class="post-meta">
                    <div class="meta-left">
                      <span class="meta-item">
                        <el-icon><View/></el-icon>
                        {{ post.viewCount || 0 }}
                      </span>
                      <span class="meta-item">
                        <el-icon><ChatLineRound/></el-icon>
                        {{ post.commentCount || 0 }}
                      </span>
                      <span class="meta-item">
                        <el-icon><Star/></el-icon>
                        {{ post.likeCount || 0 }}
                      </span>
                      <span class="meta-item">
                        <el-icon><Collection/></el-icon>
                        {{ post.collectCount || 0 }}
                      </span>
                    </div>
                    <div class="meta-right">
                      <span class="hot-score">
                        <el-icon><Sunrise/></el-icon>
                        热度 {{ formatHotScore(post.hotScore) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :xs="24" :sm="8" :md="8" :lg="7">
          <div class="sidebar">
            <el-card class="hot-rank-card">
              <template #header>
                <div class="card-header">
                  <span>TOP 5</span>
                </div>
              </template>
              <div class="top-list">
                <div
                    v-for="(post, index) in topPosts"
                    :key="index"
                    class="top-item"
                    @click="viewPost(post.id)"
                >
                  <span class="top-rank" :class="getRankClass(index)">{{ index + 1 }}</span>
                  <span class="top-title">{{ post.title }}</span>
                  <span class="top-score">{{ formatHotScore(post.hotScore) }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {marked} from 'marked'
import {ElMessage} from 'element-plus'
import {
  TrendCharts,
  View,
  ChatLineRound,
  Star,
  Collection,
  Sunrise
} from '@element-plus/icons-vue'
import {postApi} from '@/api/post'
import type {PostVO} from '@/models/vo/post/PostVO'

const router = useRouter()
const loading = ref(true)
const hotPosts = ref<PostVO[]>([])

const topPosts = computed(() => hotPosts.value.slice(0, 5))

const loadHotPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.listHotPosts(20)
    if (res.code === 200 && res.data) {
      hotPosts.value = res.data as PostVO[]
    } else {
      ElMessage.error(res.message || '获取热门文章失败')
    }
  } catch (error) {
    console.error('获取热门文章失败:', error)
    ElMessage.error('获取热门文章失败')
  } finally {
    loading.value = false
  }
}

const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-gold'
  if (index === 1) return 'rank-silver'
  if (index === 2) return 'rank-bronze'
  return ''
}

const formatHotScore = (score?: number): string => {
  if (!score) return '0'
  if (score >= 10000) return (score / 10000).toFixed(1) + 'w'
  if (score >= 1000) return (score / 1000).toFixed(1) + 'k'
  return score.toFixed(0)
}

const getContentPreview = (content?: string): string => {
  if (!content) return ''
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

const renderMarkdown = (text: string): string => {
  if (!text) return ''
  return marked.parse(text)
}

const viewPost = (postId?: number) => {
  if (postId) {
    router.push(`/post/${postId}`)
  }
}

onMounted(() => {
  loadHotPosts()
})
</script>

<style scoped>
.hot-posts-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #303133;
  margin: 0 0 10px 0;
}

.page-subtitle {
  color: #909399;
  font-size: 1rem;
  margin: 0;
}

.hot-list-container {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-height: 500px;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hot-post-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-post-card:hover {
  background: #f5f7fa;
  transform: translateX(4px);
}

.rank-badge {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 700;
  background: #f0f2f5;
  color: #606266;
  flex-shrink: 0;
}

.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #fff;
}

.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: #fff;
}

.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
}

.post-content {
  flex: 1;
  min-width: 0;
}

.post-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-preview {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.markdown-preview {
  font-size: 0.9rem;
  color: #606266;
}

.markdown-preview :deep(p) {
  margin: 0;
  line-height: 1.6;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  margin: 0 0 0.5em 0;
  font-size: 1em;
  font-weight: 600;
}

.markdown-preview :deep(code) {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}

.markdown-preview :deep(pre),
.markdown-preview :deep(pre code),
.markdown-preview :deep(blockquote),
.markdown-preview :deep(ul),
.markdown-preview :deep(ol),
.markdown-preview :deep(img) {
  display: none;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-left {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #909399;
}

.hot-score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #f56c6c;
}

.sidebar {
  position: sticky;
  top: 20px;
}

.hot-rank-card {
  border-radius: 12px;
}

.card-header {
  font-weight: 600;
  color: #303133;
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.top-item:hover {
  background: #f5f7fa;
}

.top-rank {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: #f0f2f5;
  color: #606266;
}

.top-title {
  flex: 1;
  font-size: 0.9rem;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-score {
  font-size: 0.8rem;
  color: #f56c6c;
  font-weight: 500;
}

@media (max-width: 768px) {
  .hot-post-card {
    flex-direction: column;
  }

  .rank-badge {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }

  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
