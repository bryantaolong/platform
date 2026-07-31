<script setup lang="ts">
import { ref, computed } from 'vue';
import { Modal, Button, Select, Input, Message } from '@arco-design/web-vue';
import { marked } from 'marked';
import * as llmChatApi from '@/api/llm/llmChat';

interface ChatMessage {
  role: string;
  content: string;
}

const providerOptions = [
  { label: 'DeepSeek V3.2', value: 'deepseek' },
  { label: 'Kimi K2.5', value: 'moonshot' },
  { label: 'MiniMax-M2.1', value: 'minimax' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const userMessage = ref('');
const messages = ref<ChatMessage[]>([]);
const loading = ref(false);
const selectedProvider = ref<string>('deepseek');

const renderMarkdown = (text: string) => {
  return marked.parse(text || '') as string;
};

const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  const input = userMessage.value;
  messages.value = [...messages.value, { role: 'user', content: input }];
  userMessage.value = '';
  loading.value = true;

  try {
    const res = await llmChatApi.sendChatMessage(input, selectedProvider.value);
    messages.value = [...messages.value, { role: 'ai', content: res.reply }];
  } catch (err: any) {
    const errorMessage =
      err?.message ||
      err?.msg ||
      (typeof err === 'string' ? err : '') ||
      '请求失败，请稍后重试。';
    messages.value = [...messages.value, { role: 'ai', content: `⚠️ ${errorMessage}` }];
  } finally {
    loading.value = false;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const handleClearContext = () => {
  Modal.confirm({
    title: '清空上下文确认',
    content: '确定要清空 AI 的上下文记忆吗？这会重置对话上下文。',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await llmChatApi.clearChatContext();
        messages.value = [];
        Message.success(res.data || '上下文已清空');
      } catch {
        Message.error('清空失败，请稍后重试');
      }
    },
  });
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Modal
    title="AI 聊天"
    :visible="visible"
    @cancel="handleClose"
    :style="{ width: 600 }"
    :footer="[
      { key: 'close', render: () => h(Button, { onClick: handleClose }, { default: () => '关闭' }) },
      { key: 'clear', render: () => h(Button, { status: 'warning', onClick: handleClearContext }, { default: () => '清空上下文' }) },
      { key: 'send', render: () => h(Button, { type: 'primary', loading, onClick: sendMessage }, { default: () => '发送' }) },
    ]"
  >
    <div className="chat-header">
      <span className="chat-header-label">当前模型：</span>
      <Select
        :value="selectedProvider"
        @change="selectedProvider = $event"
        :style="{ width: 180 }"
        :disabled="loading"
      >
        <Select.Option v-for="item in providerOptions" :key="item.value" :value="item.value">
          {{ item.label }}
        </Select.Option>
      </Select>
    </div>

    <div className="chat-box">
      <div className="chat-messages">
        <div v-for="(msg, index) in messages" :key="index" :className="msg.role">
          <span v-html="renderMarkdown(msg.content)"></span>
        </div>
      </div>
      <Input.TextArea
        v-model="userMessage"
        placeholder="请输入消息..."
        :rows="3"
        :disabled="loading"
        @keydown="handleKeyDown"
      />
    </div>
  </Modal>
</template>
