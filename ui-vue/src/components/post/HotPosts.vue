<template>
  <div class="hot-posts-container">
    <div class="section-header">
      <h3 class="section-title">
        <el-icon><TrendCharts/></el-icon>
        热门文章
      </h3>
      <el-select v-model="limit" size="small" @change="loadHotPosts">
        <el-option :value="5" label="Top 5"/>
        <el-option :value="10" label="Top 10"/>
        <el-option :value="20" label="Top 20"/>
      </el-select>
    </div>

    <el-skeleton v-if="loading" :rows="3" animated/>
    <el-empty v-else-if="hotPosts.length === 0" description="暂无热门文章"/>

    <div v-else class="hot-posts-list">
      <div
          v-for="(post, index) in hotPosts"
          :key="post.id"
          class="hot-post-item"
          @click="post.id && goToPostDetail(post.id)"
      >
        <span class="rank-number" :class="getRankClass(index)">{{ index + 1 }}</span>
        <div class="hot-post-content">
          <h4 class="hot-post-title">{{ post.title }}</h4>
          <div class="hot-post-meta">
            <span class="hot-score">
              <el-icon><Sunrise/></el-icon>
              {{ formatHotScore(post.hotScore) }}
            </span>
            <span class="hot-stats">
              <el-icon><View/></el-icon> {{ post.viewCount || 0 }}
              <el-icon><ChatLineRound/></el-icon> {{ post.commentCount || 0 }}
              <el-icon><Star/></el-icon> {{ post.likeCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {TrendCharts, Sunrise, View, ChatLineRound, Star} from '@element-plus/icons-vue'
import {postApi} from '@/api/post.ts'
import type {PostVO} from '@/models/vo/post/PostVO'

const router = useRouter()

const hotPosts = ref<PostVO[]>([])
const loading = ref(true)
const limit = ref(10)

const loadHotPosts = async () => {
  loading.value = true
  try {
    const res = await postApi.listHotPosts(limit.value)
    if (res.code === 200 && res.data) {
      hotPosts.value = res.data as PostVO[]
    }
  } catch (error) {
    console.error('获取热门文章失败:', error)
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
  if (score >= 1000) return (score / 1000).toFixed(1) + 'k'
  return score.toFixed(0)
}

const goToPostDetail = (id: number) => router.push(`/post/${id}`)

defineExpose({
  loadHotPosts
})

onMounted(() => {
  loadHotPosts()
})
</script>

<style scoped>
.hot-posts-container {
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

.hot-posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-post-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.hot-post-item:hover {
  background: #f5f7fa;
}

.rank-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: #f0f2f5;
  color: #606266;
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

.hot-post-content {
  flex: 1;
  min-width: 0;
}

.hot-post-title {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.hot-score {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f56c6c;
  font-weight: 500;
}

.hot-stats {
  display: flex;
  gap: 8px;
  align-items: center;
}

.hot-stats .el-icon {
  margin-right: 2px;
}
</style>
