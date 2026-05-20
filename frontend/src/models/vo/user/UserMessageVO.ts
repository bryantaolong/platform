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
