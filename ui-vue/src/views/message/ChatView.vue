<template>
  <div class="chat-page">
    <el-card class="chat-card">
      <template #header>
        <div class="chat-header">
          <el-button @click="goBack" :icon="ArrowLeft" text>返回</el-button>
          <div class="chat-title">
            <el-avatar :size="36" :src="getAvatarUrl(contactAvatar)">
              {{ contactName?.charAt(0).toUpperCase() }}
            </el-avatar>
            <span class="contact-name">{{ contactName }}</span>
          </div>
          <div class="header-spacer"></div>
        </div>
      </template>

      <div class="chat-container" ref="chatContainer">
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="messages.length === 0" class="empty-chat">
          <el-empty description="开始发送消息吧" />
        </div>

        <div v-else class="messages-wrapper">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'is-self': isSelfMessage(msg) }"
          >
            <el-avatar
              :size="40"
              :src="isSelfMessage(msg) ? getAvatarUrl(userStore.userProfile?.avatar) : getAvatarUrl(msg.senderAvatar)"
              class="message-avatar"
            >
              {{ (isSelfMessage(msg) ? userStore.userInfo?.username : msg.senderUsername)?.charAt(0).toUpperCase() }}
            </el-avatar>

            <div class="message-content-wrapper">
              <div class="message-header">
                <span class="sender-name">
                  {{ isSelfMessage(msg) ? userStore.userInfo?.username : msg.senderUsername }}
                </span>
                <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
                <el-tag v-if="msg.readStatus === 1 && isSelfMessage(msg)" size="small" type="success">
                  已读
                </el-tag>
                <el-tag v-else-if="msg.readStatus === 0 && isSelfMessage(msg)" size="small" type="info">
                  未读
                </el-tag>
              </div>

              <div class="message-bubble" :class="{ 'recalled': msg.status === 1 }">
                <span v-if="msg.status === 1" class="recalled-text">
                  消息已撤回
                </span>
                <span v-else class="message-text">{{ msg.content }}</span>

                <el-dropdown
                  v-if="canRecall(msg)"
                  trigger="click"
                  @command="handleRecall(msg.id)"
                >
                  <el-icon class="message-action"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="recall">撤回</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <div class="input-wrapper">
          <el-input
            v-model="messageText"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            maxlength="2000"
            show-word-limit
            @keyup.enter.ctrl="sendMessage"
            resize="none"
          />
          <div class="input-actions">
            <span class="input-tip">Ctrl + Enter 发送</span>
            <el-button
              type="primary"
              :icon="Promotion"
              @click="sendMessage"
              :loading="sending"
              :disabled="!messageText.trim()"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Promotion, MoreFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getMessageHistory,
  sendMessage as sendMessageApi,
  recallMessage as recallMessageApi,
  markAsRead,
  canChatWith
} from '@/api/user/userMessage.ts'
import { getAvatarUrl } from '@/utils/file'
import type { UserMessageVO } from '@/models/vo/user/UserMessageVO.ts'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const contactId = ref(Number(route.params.userId))
const contactName = ref(route.query.name as string || '')
const contactAvatar = ref('')

const loading = ref(false)
const sending = ref(false)
const messages = ref<UserMessageVO[]>([])
const messageText = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const pageNum = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
let pollInterval: ReturnType<typeof setInterval> | null = null

const isSelfMessage = (msg: UserMessageVO) => msg.senderId === userStore.userInfo?.id

const canRecall = (msg: UserMessageVO) => {
  if (msg.status === 1) return false
  if (msg.senderId !== userStore.userInfo?.id) return false
  const sentTime = new Date(msg.createdAt).getTime()
  const now = new Date().getTime()
  return now - sentTime < 2 * 60 * 1000
}

const checkCanChat = async () => {
  try {
    const response = await canChatWith(contactId.value)
    if (response.code === 200 && !response.data) {
      ElMessage.warning('只能与互相关注的用户发送消息')
      router.push('/messages')
      return false
    }
    return true
  } catch (error) {
    ElMessage.error('检查权限失败')
    router.push('/messages')
    return false
  }
}

const loadMessages = async (isLoadMore = false) => {
  if (!isLoadMore) {
    loading.value = true
  }
  try {
    const response = await getMessageHistory(contactId.value, pageNum.value, pageSize.value)
    if (response.code === 200) {
      const newMessages = response.data.rows
      if (isLoadMore) {
        messages.value = [...newMessages.reverse(), ...messages.value]
      } else {
        messages.value = newMessages.reverse()
        await scrollToBottom()
      }
      hasMore.value = messages.value.length < response.data.total

      // 从消息中提取联系人头像
      if (!contactAvatar.value && newMessages.length > 0) {
        const contactMsg = newMessages.find(msg => msg.senderId === contactId.value)
        if (contactMsg?.senderAvatar) {
          contactAvatar.value = contactMsg.senderAvatar
        }
      }
    }
  } catch (error) {
    ElMessage.error('加载消息失败')
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  const content = messageText.value.trim()
  if (!content) return

  sending.value = true
  try {
    const response = await sendMessageApi({
      receiverId: contactId.value,
      content: content
    })
    if (response.code === 200) {
      messageText.value = ''
      pageNum.value = 1
      await loadMessages()
      await scrollToBottom()
    }
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

const handleRecall = async (messageId: number) => {
  try {
    await ElMessageBox.confirm('确定要撤回这条消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await recallMessageApi(messageId)
    if (response.code === 200) {
      ElMessage.success('撤回成功')
      await loadMessages()
    }
  } catch {
    // 取消撤回
  }
}

const markMessagesAsRead = async () => {
  try {
    await markAsRead(contactId.value)
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

const formatTime = (timeStr?: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

const goBack = () => {
  router.push('/messages')
}

const startPolling = () => {
  pollInterval = setInterval(() => {
    if (pageNum.value === 1) {
      loadMessages()
      markMessagesAsRead()
    }
  }, 5000)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(async () => {
  const canChat = await checkCanChat()
  if (canChat) {
    await loadMessages()
    await markMessagesAsRead()
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.chat-page {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 20px;
  height: calc(100vh - 120px);
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
}

.header-spacer {
  width: 80px;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

.loading-container {
  padding: 20px;
}

.empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
}

.message-item.is-self {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content-wrapper {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-item.is-self .message-content-wrapper {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.message-item.is-self .message-header {
  flex-direction: row-reverse;
}

.sender-name {
  font-weight: 500;
}

.message-bubble {
  position: relative;
  padding: 12px 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  word-break: break-word;
}

.message-item.is-self .message-bubble {
  background-color: #409eff;
  color: #fff;
}

.message-bubble.recalled {
  background-color: #f4f4f5;
  color: #909399;
}

.recalled-text {
  font-style: italic;
}

.message-text {
  line-height: 1.6;
}

.message-action {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: -24px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.message-bubble:hover .message-action {
  opacity: 1;
}

.chat-input-area {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-tip {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .chat-page {
    padding: 0 10px;
    height: calc(100vh - 100px);
  }

  .message-content-wrapper {
    max-width: 85%;
  }

  .chat-container {
    padding: 12px;
  }
}
</style>
