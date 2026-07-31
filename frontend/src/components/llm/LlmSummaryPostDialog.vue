<script setup lang="ts">
import { ref, useImperativeHandle, forwardRef } from 'vue';
import { Modal, Button, lert, Empty, Spin, Message } from '@arco-design/web-vue';
import { IconRobot } from '@arco-design/web-vue/es/icon';
import * as llmChatApi from '@/api/llm/llmChat';

interface Props {
  title: string;
  content: string;
}

export interface LlmSummaryPostDialogRef {
  open: () => void;
}

const emit = defineEmits<{
  (e: 'open'): void;
}>();

const props = defineProps<Props>();

const visible = ref(false);
const loading = ref(false);
const summary = ref('');
const error = ref('');

defineExpose({
  open: () => {
    visible.value = true;
    error.value = '';
  },
});

const handleGenerate = async () => {
  if (!props.title || !props.content) {
    Message.warning('文章标题或内容为空');
    return;
  }

  loading.value = true;
  error.value = '';
  summary.value = '';

  try {
    const response = await llmChatApi.generatePostSummary(props.title, props.content);
    summary.value = response.summary;
    Message.success('AI 摘要生成成功');
  } catch (err) {
    console.error('生成 AI 摘要失败:', err);
    error.value = '生成摘要失败，请稍后重试';
    Message.error('生成摘要失败');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  summary.value = '';
  error.value = '';
};
</script>

<template>
  <Modal
    title="AI 文章摘要"
    :visible="visible"
    @cancel="handleClose"
    :footer="[
      { key: 'close', render: () => h(Button, { onClick: handleClose }, { default: () => '关闭' }) },
      { key: 'generate', render: () => h(Button, { type: 'primary', icon: IconRobot, loading, disabled: loading, onClick: handleGenerate }, { default: () => (summary ? '重新生成' : '生成摘要') }) },
    ]"
  >
    <Spin :loading="loading" className="summary-content">
      <Alert v-if="error" type="error" :content="error" />
      <div v-else-if="summary" className="summary-text">{{ summary }}</div>
      <Empty v-else description="点击下方按钮生成 AI 摘要" />
    </Spin>
  </Modal>
</template>
