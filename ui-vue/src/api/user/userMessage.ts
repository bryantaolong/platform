import request from '@/utils/request.ts'
import type { Result } from '@/models/response/Result.ts'
import type { PageResult } from '@/models/response/PageResult.ts'
import type { UserMessageVO } from '@/models/vo/user/UserMessageVO.ts'
import type { ConversationVO } from '@/models/vo/user/ConversationVO.ts'
import type { SendMessageRequest } from '@/models/request/user/SendMessageRequest.ts'

/**
 * 用户私信消息API
 */

/**
 * 发送私信
 */
export function sendMessage(data: SendMessageRequest): Promise<Result<number>> {
  return request.post('/api/user-messages/send', data)
}

/**
 * 获取与指定用户的消息历史（分页）
 */
export function getMessageHistory(
  contactId: number,
  pageNum = 1,
  pageSize = 20
): Promise<Result<PageResult<UserMessageVO>>> {
  return request.get(`/api/user-messages/history/${contactId}`, {
    params: { pageNum, pageSize }
  })
}

/**
 * 获取会话列表（最近联系人）
 */
export function getConversations(
  pageNum = 1,
  pageSize = 20
): Promise<Result<PageResult<ConversationVO>>> {
  return request.get('/api/user-messages/conversations', {
    params: { pageNum, pageSize }
  })
}

/**
 * 撤回消息
 */
export function recallMessage(messageId: number): Promise<Result<boolean>> {
  return request.post(`/api/user-messages/recall/${messageId}`)
}

/**
 * 标记与某用户的所有消息为已读
 */
export function markAsRead(contactId: number): Promise<Result<boolean>> {
  return request.post(`/api/user-messages/read/${contactId}`)
}

/**
 * 获取未读消息总数
 */
export function getUnreadCount(): Promise<Result<number>> {
  return request.get('/api/user-messages/unread-count')
}

/**
 * 获取与某联系人的未读消息数
 */
export function getUnreadCountWithContact(contactId: number): Promise<Result<number>> {
  return request.get(`/api/user-messages/unread-count/${contactId}`)
}

/**
 * 检查是否可以与某用户聊天（互相关注）
 */
export function canChatWith(userId: number): Promise<Result<boolean>> {
  return request.get(`/api/user-messages/can-chat/${userId}`)
}
