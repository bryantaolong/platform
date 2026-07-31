<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Avatar,
  Button,
  Tag,
  Message,
  Modal,
  Skeleton,
  Empty,
  Textarea,
  Dropdown,
  Menu,
  MenuItem,
} from '@arco-design/web-vue';
import {
  IconLeft,
  IconSend,
  IconMore,
} from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import * as userMessageApi from '@/api/user/userMessage';
import { getAvatarUrl } from '@/utils/file';
import type { UserMessageVO } from '@/models/vo/user';
import './ChatView.css';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const contactId = computed(() => Number(route.params.userId));
const contactName = computed(() => (route.query.name as string) || '');

const contactAvatar = ref('');
const loading = ref(false);
const sending = ref(false);
const messages = ref<UserMessageVO[]>([]);
const messageText = ref('');
const pageNum = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);

let pollInterval: number | null = null;
const chatContainerRef = ref<HTMLElement | null>(null);

const isSelfMessage = (msg: UserMessageVO) => msg.senderId === userStore.userInfo?.id;

const canRecall = (msg: UserMessageVO) => {
  if (msg.status === 1) return false;
  if (msg.senderId !== userStore.userInfo?.id) return false;
  const sentTime = new Date(msg.createdAt).getTime();
  const now = new Date().getTime();
  return now - sentTime < 2 * 60 * 1000;
};

const scrollToBottom = () => {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }
};

const checkCanChat = async () => {
  try {
    const response = await userMessageApi.canChatWith(contactId.value);
    if (response.code === 200 && !response.data) {
      Message.warning('只能与互相关注的用户发送消息');
      router.push('/messages');
      return false;
    }
    return true;
  } catch (error) {
    Message.error('检查权限失败');
    router.push('/messages');
    return false;
  }
};

const loadMessages = async (isLoadMore = false) => {
  if (!isLoadMore) {
    loading.value = true;
  }
  try {
    const response = await userMessageApi.getMessageHistory(contactId.value, pageNum.value, pageSize.value);
    if (response.code === 200) {
      const newMessages = response.data.rows;
      if (isLoadMore) {
        messages.value = [...newMessages.reverse(), ...messages.value];
      } else {
        messages.value = newMessages.reverse();
        nextTick(() => scrollToBottom());
      }
      hasMore.value = messages.value.length < response.data.total;

      if (!contactAvatar.value && newMessages.length > 0) {
        const contactMsg = newMessages.find((msg) => msg.senderId === contactId.value);
        if (contactMsg?.senderAvatar) {
          contactAvatar.value = contactMsg.senderAvatar;
        }
      }
    }
  } catch (error) {
    Message.error('加载消息失败');
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  const content = messageText.value.trim();
  if (!content) return;

  sending.value = true;
  try {
    const response = await userMessageApi.sendMessage({
      receiverId: contactId.value,
      content: content,
    });
    if (response.code === 200) {
      messageText.value = '';
      pageNum.value = 1;
      await loadMessages();
    }
  } catch (error) {
    Message.error('发送失败');
  } finally {
    sending.value = false;
  }
};

const handleRecall = async (messageId: number) => {
  try {
    await Modal.confirm({
      title: '提示',
      content: '确定要撤回这条消息吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await userMessageApi.recallMessage(messageId);
          if (response.code === 200) {
            Message.success('撤回成功');
            await loadMessages();
          }
        } catch (error) {
          Message.error('撤回失败');
        }
      },
    });
  } catch {
    // 取消撤回
  }
};

const markMessagesAsRead = async () => {
  try {
    await userMessageApi.markAsRead(contactId.value);
  } catch (error) {
    console.error('标记已读失败', error);
  }
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

const goBack = () => {
  router.push('/messages');
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault();
    sendMessage();
  }
};

onMounted(async () => {
  const canChat = await checkCanChat();
  if (canChat) {
    await loadMessages();
    await markMessagesAsRead();
  }
  pollInterval = setInterval(() => {
    if (pageNum.value === 1) {
      loadMessages();
      markMessagesAsRead();
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});
</script>

<template>
  <div class="chat-page">
    <a-card class="chat-card">
      <div class="chat-header">
        <a-button type="text" @click="goBack">
          <template #icon><icon-left /></template>
          返回
        </a-button>
        <div class="chat-title">
          <a-avatar :size="36" class="message-avatar">
            <img v-if="contactAvatar" :src="getAvatarUrl(contactAvatar)" :alt="contactName" />
            <template v-else>{{ contactName?.charAt(0).toUpperCase() }}</template>
          </a-avatar>
          <span class="contact-name">{{ contactName }}</span>
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="chat-container" ref="chatContainerRef">
        <div class="loading-container" v-if="loading">
          <a-skeleton animation :rows="3" />
        </div>
        <div class="empty-chat" v-else-if="messages.length === 0">
          <a-empty description="开始发送消息吧" />
        </div>
        <div class="messages-wrapper" v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="`message-item${isSelfMessage(msg) ? ' is-self' : ''}`"
          >
            <a-avatar :size="40" class="message-avatar">
              <img v-if="isSelfMessage(msg) && userStore.userProfile?.avatar" :src="getAvatarUrl(userStore.userProfile.avatar)" :alt="userStore.userInfo?.username" />
              <img v-else-if="!isSelfMessage(msg) && msg.senderAvatar" :src="getAvatarUrl(msg.senderAvatar)" :alt="msg.senderUsername" />
              {{ (isSelfMessage(msg) ? userStore.userInfo?.username : msg.senderUsername)?.charAt(0).toUpperCase() }}
            </a-avatar>

            <div class="message-content-wrapper">
              <div class="message-header">
                <span class="sender-name">
                  {{ isSelfMessage(msg) ? userStore.userInfo?.username : msg.senderUsername }}
                </span>
                <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
                <a-tag v-if="msg.readStatus === 1 && isSelfMessage(msg)" size="small" color="green">已读</a-tag>
                <a-tag v-else-if="msg.readStatus === 0 && isSelfMessage(msg)" size="small" color="gray">未读</a-tag>
              </div>

              <div :class="`message-bubble${msg.status === 1 ? ' recalled' : ''}`">
                <span v-if="msg.status === 1" class="recalled-text">消息已撤回</span>
                <span v-else class="message-text">{{ msg.content }}</span>

                <a-dropdown v-if="canRecall(msg)" trigger="click">
                  <icon-more class="message-action" />
                  <template #dropdown>
                    <a-menu @select="(key) => { if (key === 'recall') handleRecall(msg.id) }">
                      <a-menu-item key="recall">撤回</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="input-wrapper">
          <a-textarea
            v-model="messageText"
            :rows="3"
            placeholder="输入消息..."
            :max-length="2000"
            show-word-limit
            @keydown="handleKeyDown"
            style="resize: none"
          />
          <div class="input-actions">
            <span class="input-tip">Ctrl + Enter 发送</span>
            <a-button type="primary" @click="sendMessage" :loading="sending" :disabled="!messageText.trim()">
              <template #icon><icon-send /></template>
              发送
            </a-button>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>
