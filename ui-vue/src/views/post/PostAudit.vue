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

      <div class="post-content" v-html="post?.content"></div>

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
.audit-card {
  margin-bottom: 20px;
}
</style>