<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <div class="comment-header">
      <el-avatar :size="isReply ? 32 : 40" :src="getAvatarUrl(comment.avatar)">
        {{ comment.username ? comment.username.charAt(0).toUpperCase() : '' }}
      </el-avatar>

      <div class="comment-user-info">
        <div class="comment-author">
          {{ comment.username }}
          <el-tag v-if="comment.floor" size="small" type="info" class="floor-tag">
            #{{ comment.floor }}
          </el-tag>
        </div>
        <div class="comment-time">{{ formatDateTime(comment.createdAt) }}</div>
      </div>
    </div>

    <div class="comment-content">
      <div v-if="comment.replyToUsername" class="reply-to">
        回复 <span class="reply-to-user">@{{ comment.replyToUsername }}</span>
      </div>
      <div class="content-text">{{ comment.content }}</div>
    </div>

    <div class="comment-actions">
      <el-button
          size="small"
          text
          :icon="ChatLineRound"
          @click="handleReply"
      >
        回复
      </el-button>
      <el-button
          size="small"
          text
          :icon="isLiked ? Star : ArrowUpBold"
          :type="isLiked ? 'danger' : 'default'"
          @click="handleLike"
      >
        {{ comment.likeCount || 0 }}
      </el-button>
      <el-button
          v-if="canDelete"
          size="small"
          text
          :icon="Delete"
          type="danger"
          @click="handleDelete"
      >
        删除
      </el-button>
    </div>

    <div v-if="showReplyForm" class="reply-form-container">
      <CommentForm
          :post-id="comment.postId"
          :parent-id="comment.id"
          :reply-to-user-id="comment.userId"
          :reply-to-username="comment.username"
          @submit="handleReplySubmit"
          @cancel="showReplyForm = false"
      />
    </div>

    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
      <div class="replies-header" v-if="comment.childCount > comment.replies.length">
        <el-button text size="small" @click="loadMoreReplies">
          查看更多回复 ({{ comment.childCount - comment.replies.length }})
        </el-button>
      </div>
      <CommentItem
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :is-reply="true"
          @reply="handleReply"
          @like="handleLike"
          @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatLineRound, ArrowUpBold, Star, Delete } from '@element-plus/icons-vue'
import CommentForm from './CommentForm.vue'
import * as commentApi from '@/api/postComment.ts'
import { getAvatarUrl } from '@/utils/file'
import type { CommentVO } from '@/models/vo/post/CommentVO'


interface Props {
  comment: CommentVO
  isReply?: boolean
}

interface Emits {
  (e: 'reply', commentId: number): void
  (e: 'like', commentId: number): void
  (e: 'delete', commentId: number): void
}

const props = withDefaults(defineProps<Props>(), {
  isReply: false
})

const emit = defineEmits<Emits>()

const showReplyForm = ref(false)
const isLiked = ref(false)

const canDelete = computed(() => {
  return false
})

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const checkLikeStatus = async () => {
  try {
    const response = await commentApi.checkLikeStatus(props.comment.id)
    if (response.code === 200) {
      isLiked.value = response.data
    }
  } catch (error) {
    console.error('检查点赞状态失败:', error)
  }
}

onMounted(() => {
  checkLikeStatus()
})

const handleReply = () => {
  showReplyForm.value = !showReplyForm.value
  emit('reply', props.comment.id)
}

const handleReplySubmit = () => {
  showReplyForm.value = false
  emit('reply', props.comment.id)
}

const handleLike = async () => {
  try {
    if (isLiked.value) {
      const response = await commentApi.unlikeComment(props.comment.id)
      if (response.code === 200) {
        isLiked.value = false
        props.comment.likeCount = Math.max(0, (props.comment.likeCount || 0) - 1)
        ElMessage.info('已取消点赞')
      } else {
        ElMessage.error(response.message || '取消点赞失败')
      }
    } else {
      const response = await commentApi.likeComment(props.comment.id)
      if (response.code === 200) {
        isLiked.value = true
        props.comment.likeCount = (props.comment.likeCount || 0) + 1
        ElMessage.success('点赞成功')
      } else {
        ElMessage.error(response.message || '点赞失败')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败')
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
        '确定要删除这条评论吗？此操作不可恢复！',
        '删除评论',
        { type: 'warning' }
    )

    const response = await commentApi.deleteComment(props.comment.id)
    if (response.code === 200) {
      ElMessage.success('评论已删除')
      emit('delete', props.comment.id)
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch {
  }
}

const loadMoreReplies = async () => {
  try {
    const response = await commentApi.listRepliesByCommentId(props.comment.id)
    if (response.code === 200 && response.data) {
      if (!props.comment.replies) {
        props.comment.replies = []
      }
      props.comment.replies.push(...response.data)
    }
  } catch (error) {
    console.error('加载更多回复失败:', error)
    ElMessage.error('加载失败')
  }
}
</script>

<style scoped>
.comment-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item.is-reply {
  padding: 12px 0;
  padding-left: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.floor-tag {
  font-size: 12px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin: 12px 0;
  padding-left: 52px;
}

.reply-to {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.reply-to-user {
  color: #409eff;
  font-weight: 500;
}

.content-text {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  gap: 8px;
  padding-left: 52px;
}

.reply-form-container {
  margin-top: 12px;
  padding-left: 52px;
}

.replies-container {
  margin-top: 12px;
}

.replies-header {
  margin-bottom: 8px;
}
</style>
