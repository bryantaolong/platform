<template>
  <el-dialog
      v-model="visible"
      title="AI 文章摘要"
      width="600px"
      :close-on-click-modal="false"
      @closed="handleClosed"
  >
    <div v-loading="loading" class="summary-content">
      <el-alert
          v-if="error"
          :title="error"
          type="error"
          :closable="false"
          show-icon
      />
      <div v-else-if="summary" class="summary-text">
        {{ summary }}
      </div>
      <el-empty v-else description="点击下方按钮生成 AI 摘要" />
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button
          type="primary"
          :icon="MagicStick"
          @click="handleGenerate"
          :loading="loading"
          :disabled="loading"
      >
        {{ summary ? '重新生成' : '生成摘要' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import * as llmChatApi from '@/api/llm/llmChat.ts'

// Props
interface Props {
  title: string
  content: string
}

const props = defineProps<Props>()

// State
const visible = ref(false)
const loading = ref(false)
const summary = ref('')
const error = ref('')

// Methods
const open = () => {
  visible.value = true
  error.value = ''
}

const handleGenerate = async () => {
  if (!props.title || !props.content) {
    ElMessage.warning('文章标题或内容为空')
    return
  }

  loading.value = true
  error.value = ''
  summary.value = ''

  try {
    const response = await llmChatApi.generatePostSummary(props.title, props.content)
    summary.value = response.summary
    ElMessage.success('AI 摘要生成成功')
  } catch (err) {
    console.error('生成 AI 摘要失败:', err)
    error.value = '生成摘要失败，请稍后重试'
    ElMessage.error('生成摘要失败')
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  // Reset state when dialog is closed
  summary.value = ''
  error.value = ''
}

// Expose methods for parent component
defineExpose({
  open
})
</script>

<style scoped>
.summary-content {
  min-height: 200px;
  padding: 20px 0;
}

.summary-text {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
}
</style>
