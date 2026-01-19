<!-- src/views/post/PostAudit.vue -->
<template>
  <div class="blog-post-detail-container" v-loading="loading">
    <!-- 审核操作卡片 -->
    <el-card class="post-card" style="margin-bottom:20px">
      <template #header>
        <div class="post-header">
          <span class="post-title" style="font-size:18px">博文审核</span>
          <el-tag :type="tagType" size="large">{{ tagText }}</el-tag>
        </div>
      </template>

      <el-form label-width="80px" v-if="post?.status === PostStatusEnum.AUDITING">
        <el-form-item label="审核意见">
          <el-input
              v-model="auditReason"
              type="textarea"
              :rows="3"
              placeholder="选填，驳回时请填写原因"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :icon="Check" @click="handleAudit(PostStatusEnum.PUBLISHED)">
            通过
          </el-button>
          <el-button type="danger" :icon="Close" @click="handleAudit(PostStatusEnum.RECYCLED)">
            驳回
          </el-button>
        </el-form-item>
      </el-form>

      <el-button v-else @click="$router.back()">返回列表</el-button>
    </el-card>

    <!-- 原有博文详情卡片 -->
    <el-card class="post-card">
      <template #header>
        <div class="post-header">
          <h1 class="post-title">{{ post?.title }}</h1>
          <div class="post-meta">
            <div class="meta-item">
              <el-icon><User /></el-icon>
              <span>{{ post?.author }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDateTime(post?.createdAt) }}</span>
            </div>
            <div class="meta-item" v-if="post?.viewCount !== undefined">
              <el-icon><View /></el-icon>
              <span>浏览: {{ post?.viewCount }}</span>
            </div>
            <div class="meta-item" v-if="post?.likeCount !== undefined">
              <el-icon><Star /></el-icon>
              <span>点赞: {{ post?.likeCount }}</span>
            </div>
            <div class="meta-item" v-if="post?.commentCount !== undefined">
              <el-icon><ChatLineRound /></el-icon>
              <span>评论: {{ post?.commentCount }}</span>
            </div>
            <div class="meta-item" v-if="post?.collectCount !== undefined">
              <el-icon><Collection /></el-icon>
              <span>收藏: {{ post?.collectCount }}</span>
            </div>
          </div>
        </div>
      </template>

      <div class="post-content-wrapper">
        <div class="markdown-viewer">
          <div class="source-pane">
            <div class="pane-title">源码</div>
            <pre class="source-code">{{ post?.content }}</pre>
          </div>
          <div class="preview-pane">
            <div class="pane-title">预览</div>
            <div class="markdown-body" v-html="renderedContent"></div>
          </div>
        </div>
      </div>

      <div class="post-tags" v-if="post?.tags && post.tags.length">
        <el-tag
            v-for="tag in post.tags"
            :key="tag"
            class="tag-item"
            type="info"
            size="small"
        >
          {{ tag }}
        </el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  Close,
  User,
  Clock,
  View,
  Star,
  ChatLineRound,
  Collection
} from '@element-plus/icons-vue'
import { postApi } from '@/api/post'
import type { PostVO } from '@/models/vo/post/PostVO'
import { PostStatusEnum } from '@/models/enum/PostStatusEnum'

const route = useRoute()
const router = useRouter()
const postId = Number(route.params.id)
const loading = ref(true)
const post = ref<PostVO | null>(null)
const auditReason = ref('')

const renderedContent = computed(() => {
  return marked.parse(post.value?.content || '')
})

const tagMap: Record<string, { label: string; type: any }> = {
  [PostStatusEnum.PUBLISHED]: { label: '已发布', type: 'success' },
  [PostStatusEnum.DRAFT]: { label: '草稿', type: 'info' },
  [PostStatusEnum.PRIVATE]: { label: '仅自己可见', type: 'warning' },
  [PostStatusEnum.AUDITING]: { label: '审核中', type: '' },
  [PostStatusEnum.RECYCLED]: { label: '回收站', type: 'danger' }
}

const tagType = computed(() => tagMap[post.value?.status || PostStatusEnum.AUDITING].type)
const tagText = computed(() => tagMap[post.value?.status || PostStatusEnum.AUDITING].label)

const loadPost = async () => {
  if (!postId) {
    ElMessage.error('文章ID不存在')
    return
  }
  try {
    // 关键：用审核接口，而不是普通详情接口
    const res = await postApi.getPostAuditById(postId)
    if (res.code === 200) {
      post.value = res.data as PostVO
    } else {
      ElMessage.error(res.message || '获取文章失败')
    }
  } catch (e) {
    ElMessage.error('获取文章失败')
  } finally {
    loading.value = false
  }
}

const handleAudit = async (status: PostStatusEnum) => {
  if (status === PostStatusEnum.RECYCLED && !auditReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  try {
    await ElMessageBox.confirm(
        status === PostStatusEnum.PUBLISHED ? '确认通过该博文？' : '确认驳回该博文？',
        '提示',
        { type: status === PostStatusEnum.PUBLISHED ? 'success' : 'error' }
    )
    const res = await postApi.updatePostStatus(postId, status)
    if (res.code === 200) {
      ElMessage.success(status === PostStatusEnum.PUBLISHED ? '已通过' : '已驳回')
      loadPost()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    /* user cancel */
  }
}

const formatDateTime = (str?: string) => (str ? new Date(str).toLocaleString('zh-CN') : '')

onMounted(loadPost)
</script>

<style scoped>
/* 与你原有 PostDetail.vue 完全一致，仅补一个窄间距 */
.blog-post-detail-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.post-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.post-title {
  margin: 0 0 15px 0;
  font-weight: bold;
  color: #303133;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-content-wrapper {
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.markdown-viewer {
  display: flex;
  gap: 20px;
  height: 600px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.source-pane, .preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.source-pane {
  border-right: 1px solid #ebeef5;
}

.pane-title {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
  font-weight: bold;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.source-code {
  flex: 1;
  margin: 0;
  padding: 15px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #fafafa;
  color: #476582;
}

.markdown-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #fff;
  color: #24292f;
  font-size: 15px;
  line-height: 1.6;
}

/* Markdown Styles (Soft & Intuitive) */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(h1) { font-size: 1.8em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-body :deep(h2) { font-size: 1.4em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }

.markdown-body :deep(p) { margin-bottom: 1em; }

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-size: 85%;
}

.markdown-body :deep(pre) {
  padding: 16px;
  background-color: #f6f8fa;
  border-radius: 8px;
  margin-bottom: 1em;
  overflow: auto;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #656d76;
  border-left: 0.25em solid #d0d7de;
  margin: 0 0 1em 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}

.post-tags {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>