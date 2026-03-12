<template>
  <div class="message-list-page">
    <el-card class="message-list-card">
      <template #header>
        <div class="card-header">
          <h2 class="page-title">
            <el-icon><ChatDotRound /></el-icon>
            消息中心
          </h2>
          <el-badge :value="totalUnreadCount" v-if="totalUnreadCount > 0" class="unread-badge"/>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <el-empty
        v-else-if="conversations.length === 0"
        description="暂无消息，去关注其他用户并开始聊天吧"
      >
        <el-button type="primary" @click="goToFollowing">查看关注</el-button>
      </el-empty>

      <div v-else class="conversation-list">
        <div
          v-for="conv in conversations"
          :key="conv.contactId"
          class="conversation-item"
          :class="{ 'has-unread': conv.unreadCount > 0 }"
          @click="goToChat(conv.contactId, conv.contactUsername)"
        >
          <div class="avatar-section">
            <el-avatar :size="48" :src="getAvatarUrl(conv.contactAvatar)">
              {{ conv.contactUsername?.charAt(0).toUpperCase() }}
            </el-avatar>
            <el-badge
              v-if="conv.unreadCount > 0"
              :value="conv.unreadCount > 99 ? '99+' : conv.unreadCount"
              class="unread-dot"
            />
          </div>

          <div class="content-section">
            <div class="conversation-header">
              <span class="contact-name">{{ conv.contactUsername }}</span>
              <span class="message-time">{{ formatTime(conv.lastMessageTime) }}</span>
            </div>
            <div class="conversation-preview">
              <span v-if="conv.lastMessageStatus === 1" class="recalled-text">
                [消息已撤回]
              </span>
              <span v-else class="message-preview" :class="{ 'unread': conv.unreadCount > 0 }">
                {{ getPreviewText(conv) }}
              </span>
            </div>
          </div>

          <div class="action-section">
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadConversations"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getConversations, getUnreadCount } from '@/api/user/userMessage.ts'
import { getAvatarUrl } from '@/utils/file'
import type { ConversationVO } from '@/models/vo/user/ConversationVO.ts'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const conversations = ref<ConversationVO[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalUnreadCount = ref(0)
let pollInterval: ReturnType<typeof setInterval> | null = null

const loadConversations = async () => {
  if (!userStore.isAuthenticated) return

  loading.value = true
  try {
    const response = await getConversations(pageNum.value, pageSize.value)
    if (response.code === 200) {
      conversations.value = response.data.rows
      total.value = response.data.total
    }
  } catch (error) {
    ElMessage.error('加载会话列表失败')
  } finally {
    loading.value = false
  }
}

const loadUnreadCount = async () => {
  if (!userStore.isAuthenticated) return

  try {
    const response = await getUnreadCount()
    if (response.code === 200) {
      totalUnreadCount.value = response.data
    }
  } catch (error) {
    console.error('加载未读数失败', error)
  }
}

const getPreviewText = (conv: ConversationVO) => {
  const isSelf = conv.lastMessageSenderId === userStore.userInfo?.id
  const prefix = isSelf ? '我: ' : ''
  const content = conv.lastMessageContent || ''
  return prefix + (content.length > 30 ? content.substring(0, 30) + '...' : content)
}

const formatTime = (timeStr?: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const day = 24 * 60 * 60 * 1000

  if (diff < day && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 2 * day) {
    return '昨天'
  } else if (diff < 7 * day) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

const goToChat = (contactId: number, contactName: string) => {
  router.push({
    name: 'Chat',
    params: { userId: contactId.toString() },
    query: { name: contactName }
  })
}

const goToFollowing = () => {
  router.push('/following')
}

const startPolling = () => {
  pollInterval = setInterval(() => {
    loadUnreadCount()
    if (pageNum.value === 1) {
      loadConversations()
    }
  }, 10000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  loadConversations()
  loadUnreadCount()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.message-list-page {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.message-list-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-container {
  padding: 20px;
}

.conversation-list {
  display: flex;
  flex-direction: column;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.3s;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-item.has-unread {
  background-color: #f0f9ff;
}

.avatar-section {
  position: relative;
  margin-right: 12px;
}

.unread-dot {
  position: absolute;
  top: -4px;
  right: -4px;
}

.content-section {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.conversation-preview {
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-preview.unread {
  color: #303133;
  font-weight: 500;
}

.recalled-text {
  color: #909399;
  font-style: italic;
}

.action-section {
  margin-left: 8px;
  color: #c0c4cc;
}

.arrow-icon {
  font-size: 16px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .message-list-page {
    padding: 0 10px;
  }

  .conversation-item {
    padding: 12px;
  }
}
</style>
