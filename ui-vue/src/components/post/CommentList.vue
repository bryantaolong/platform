<template>
  <div class="comment-list-container">
    <div class="comment-tabs">
      <el-radio-group v-model="activeTab" size="small" @change="handleTabChange">
        <el-radio-button label="all">全部评论 ({{ totalCount }})</el-radio-button>
        <el-radio-button label="hot">热评</el-radio-button>
        <el-radio-button label="latest">最新</el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading" class="comments-content">
      <div v-if="comments.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无评论，快来抢沙发吧~" />
      </div>

      <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          @reply="handleReply"
          @like="handleLike"
          @delete="handleDelete"
      />

      <div v-if="hasMore && !loading" class="load-more">
        <el-button text @click="loadMore">
          加载更多评论
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import CommentItem from './CommentItem.vue'
import * as commentApi from '@/api/postComment.ts'
import type { CommentVO } from '@/models/vo/post/CommentVO'

interface Props {
  postId: number
  pageSize?: number
}

interface Emits {
  (e: 'update:total', count: number): void
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10
})

const emit = defineEmits<Emits>()

const activeTab = ref<'all' | 'hot' | 'latest'>('all')
const loading = ref(false)
const comments = ref<CommentVO[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const hasMore = ref(false)

const loadComments = async (reset = true) => {
  if (loading.value) return

  loading.value = true
  try {
    let response

    if (activeTab.value === 'all') {
      response = await commentApi.getCommentTree(props.postId)
      if (response.code === 200) {
        comments.value = response.data || []
        totalCount.value = comments.value.length
        hasMore.value = false
      }
    } else if (activeTab.value === 'hot') {
      response = await commentApi.listHotComments(props.postId, props.pageSize)
      if (response.code === 200) {
        comments.value = response.data || []
        totalCount.value = comments.value.length
        hasMore.value = false
      }
    } else if (activeTab.value === 'latest') {
      response = await commentApi.listLatestComments(props.postId, props.pageSize)
      if (response.code === 200) {
        comments.value = response.data || []
        totalCount.value = comments.value.length
        hasMore.value = false
      }
    }

    emit('update:total', totalCount.value)
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  // 评论树模式下不需要加载更多
}

const handleTabChange = () => {
  loadComments(true)
}

const handleReply = (commentId: number) => {
  console.log('Reply to comment:', commentId)
}

const handleLike = (commentId: number) => {
  console.log('Like comment:', commentId)
}

const handleDelete = (commentId: number) => {
  const index = comments.value.findIndex(c => c.id === commentId)
  if (index !== -1) {
    comments.value.splice(index, 1)
    totalCount.value--
    emit('update:total', totalCount.value)
  }
}

const refresh = () => {
  loadComments(true)
}

watch(() => props.postId, () => {
  if (props.postId) {
    loadComments(true)
  }
})

onMounted(() => {
  if (props.postId) {
    loadComments(true)
  }
})

defineExpose({
  refresh
})
</script>

<style scoped>
.comment-list-container {
  width: 100%;
}

.comment-tabs {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.comments-content {
  min-height: 200px;
}

.empty-state {
  padding: 40px 0;
}

.load-more {
  text-align: center;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
