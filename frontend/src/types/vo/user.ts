export interface UserVO {
  id: number
  username: string
  phone?: string
  email?: string
  status: 'NORMAL' | 'LOCKED' | 'BANNED'
  roles: string
  lastLoginAt?: string
  lastLoginIp?: string
  lastLoginDevice?: string
  createdAt: string
}

export interface UserProfileVO {
  userId: number
  username: string
  phone?: string
  email?: string
  realName?: string
  gender?: string
  birthday?: string
  avatar?: string
}

export interface UserMessageVO {
  id: number
  senderId: number
  senderUsername: string
  senderAvatar?: string
  receiverId: number
  receiverUsername: string
  receiverAvatar?: string
  content: string
  status: number
  readStatus: number
  readAt?: string
  recalledAt?: string
  createdAt: string
}

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

export interface UserRoleOptionVO {
  id: number
  roleName: string
}
