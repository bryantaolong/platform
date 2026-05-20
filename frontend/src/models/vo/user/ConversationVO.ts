export interface ConversationVO {
  contactId: number
  contactUsername: string
  contactAvatar?: string
  lastMessageContent: string
  lastMessageStatus: number
  lastMessageTime: string
  lastMessageSenderId: number
  unreadCount: number
}
