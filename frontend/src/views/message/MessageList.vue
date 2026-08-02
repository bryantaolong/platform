<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Skeleton,
  Empty,
  Pagination,
  Badge,
  Avatar,
  Message,
} from '@arco-design/web-vue';
import {
  IconMessage,
  IconArrowRight,
} from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/stores/user';
import * as userMessageApi from '@/api/user/userMessage.ts';
import { getAvatarUrl } from '@/utils/file';
import type { ConversationVO } from '@/types';
import './MessageList.css';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const conversations = ref<ConversationVO[]>([]);
const pageNum = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalUnreadCount = ref(0);

const loadConversations = async () => {
  if (!userStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await userMessageApi.getConversations(pageNum.value, pageSize.value);
    if (response.code === 200) {
      conversations.value = response.data.rows;
      total.value = response.data.total;
    }
  } catch (error) {
    Message.error('加载会话列表失败');
  } finally {
    loading.value = false;
  }
};

const loadUnreadCount = async () => {
  if (!userStore.isAuthenticated) return;
  try {
    const response = await userMessageApi.getUnreadCount();
    if (response.code === 200) {
      totalUnreadCount.value = response.data;
    }
  } catch (error) {
    console.error('加载未读数失败', error);
  }
};

const getPreviewText = (conv: ConversationVO) => {
  const isSelf = conv.lastMessageSenderId === userStore.userInfo?.id;
  const prefix = isSelf ? '我: ' : '';
  const content = conv.lastMessageContent || '';
  return prefix + (content.length > 30 ? content.substring(0, 30) + '...' : content);
};

const formatTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diff < day && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 2 * day) {
    return '昨天';
  } else if (diff < 7 * day) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

const goToChat = (contactId: number, contactName: string) => {
  router.push({
    path: `/chat/${contactId}`,
    query: { name: contactName },
  });
};

const goToFollowing = () => {
  router.push('/following');
};

const handlePageChange = (page: number) => {
  pageNum.value = page;
};

let pollInterval: number | null = null;

onMounted(() => {
  loadConversations();
  loadUnreadCount();
  pollInterval = setInterval(() => {
    loadUnreadCount();
    if (pageNum.value === 1) {
      loadConversations();
    }
  }, 10000);
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <div class="message-list-page">
    <a-card class="message-list-card">
      <div class="card-header">
        <h2 class="page-title">
          <icon-message />
          消息中心
        </h2>
        <a-badge v-if="totalUnreadCount > 0" :count="totalUnreadCount" class="unread-badge" />
      </div>

      <div class="loading-container" v-if="loading">
        <a-skeleton animation />
      </div>

      <div v-if="!loading && conversations.length === 0">
        <a-empty description="暂无消息，去关注其他用户并开始聊天吧" />
        <div style="text-align: center; margin-top: 12px;">
          <button class="arco-btn arco-btn-primary" @click="goToFollowing">
            查看关注
          </button>
        </div>
      </div>

      <div class="conversation-list" v-if="!loading && conversations.length > 0">
        <div
          v-for="conv in conversations"
          :key="conv.contactId"
          :class="`conversation-item${conv.unreadCount > 0 ? ' has-unread' : ''}`"
          @click="goToChat(conv.contactId, conv.contactUsername)"
        >
          <div class="avatar-section">
            <a-avatar :size="48">
              <img :src="getAvatarUrl(conv.contactAvatar)" alt="" />
              {{ conv.contactUsername?.charAt(0).toUpperCase() }}
            </a-avatar>
            <a-badge v-if="conv.unreadCount > 0" :count="conv.unreadCount > 99 ? '99+' : conv.unreadCount" class="unread-dot" />
          </div>

          <div class="content-section">
            <div class="conversation-header">
              <span class="contact-name">{{ conv.contactUsername }}</span>
              <span class="message-time">{{ formatTime(conv.lastMessageTime) }}</span>
            </div>
            <div class="conversation-preview">
              <span v-if="conv.lastMessageStatus === 1" class="recalled-text">[消息已撤回]</span>
              <span v-else :class="`message-preview${conv.unreadCount > 0 ? ' unread' : ''}`">
                {{ getPreviewText(conv) }}
              </span>
            </div>
          </div>

          <div class="action-section">
            <icon-arrow-right class="arrow-icon" />
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <a-pagination
          v-model:current="pageNum"
          :page-size="pageSize"
          :total="total"
          show-total
          @change="handlePageChange"
        />
      </div>
    </a-card>
  </div>
</template>
