<template>
  <div class="comment-form-container">
    <el-form ref="formRef" :model="form" @submit.prevent="handleSubmit">
      <el-form-item>
        <div v-if="replyToUsername" class="reply-hint">
          回复 <span class="reply-user">@{{ replyToUsername }}</span>
          <el-button text size="small" @click="handleCancelReply">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <el-input
            v-model="form.content"
            :rows="4"
            type="textarea"
            :placeholder="placeholder"
            maxlength="500"
            show-word-limit
            resize="none"
        />
      </el-form-item>
      <el-form-item>
        <el-button
            type="primary"
            :icon="Check"
            :loading="submitting"
            @click="handleSubmit"
        >
          {{ submitText }}
        </el-button>
        <el-button @click="handleCancel">
          取消
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import { commentApi } from '@/api/comment'
import type { CommentCreateRequest } from '@/models/request/post/CommentCreateRequest'

interface Props {
  postId: number
  parentId?: number
  replyToUserId?: number
  replyToUsername?: string
  submitText?: string
}

interface Emits {
  (e: 'submit'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  submitText: '发表评论'
})

const emit = defineEmits<Emits>()

const formRef = ref()
const form = ref<CommentCreateRequest>({
  postId: props.postId,
  parentId: props.parentId,
  replyToUserId: props.replyToUserId,
  content: ''
})

const submitting = ref(false)

const placeholder = computed(() => {
  if (props.replyToUsername) {
    return `回复 @${props.replyToUsername}...`
  }
  return '请输入您的评论...'
})

const handleSubmit = async () => {
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  if (form.value.content.length > 500) {
    ElMessage.warning('评论内容不能超过500字')
    return
  }

  submitting.value = true
  try {
    form.value.postId = props.postId
    form.value.parentId = props.parentId
    form.value.replyToUserId = props.replyToUserId

    const response = await commentApi.createComment(form.value)
    if (response.code === 200) {
      ElMessage.success('评论发表成功')
      form.value.content = ''
      emit('submit')
    } else {
      ElMessage.error(response.message || '发表评论失败')
    }
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('发表评论失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  form.value.content = ''
  emit('cancel')
}

const handleCancelReply = () => {
  form.value.parentId = undefined
  form.value.replyToUserId = undefined
}

const focus = () => {
  const textarea = formRef.value?.$el?.querySelector('textarea')
  if (textarea) {
    textarea.focus()
  }
}

defineExpose({
  focus
})
</script>

<style scoped>
.comment-form-container {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
}

.reply-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  font-size: 14px;
  color: #1890ff;
}

.reply-user {
  font-weight: 600;
}
</style>
