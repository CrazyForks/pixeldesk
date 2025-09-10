// Chat-related TypeScript interfaces

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  type: 'text' | 'emoji' | 'system' | 'image'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface ConversationParticipant {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  joinedAt: string
  lastReadAt: string
  isActive: boolean
  isOnline?: boolean
  lastSeen?: string | null
}

export interface ChatConversation {
  id: string
  type: 'private' | 'group'
  name?: string
  participants: ConversationParticipant[]
  lastMessage?: ChatMessage
  unreadCount: number
  createdAt: string
  updatedAt: string
}

export interface ChatNotification {
  id: string
  conversationId: string
  messageId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isRead: boolean
}

export interface TypingIndicator {
  userId: string
  userName: string
  conversationId: string
  isTyping: boolean
  timestamp: string
}

export interface TypingUser {
  userId: string
  userName: string
  timestamp: number
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ConversationsResponse {
  conversations: ChatConversation[]
  totalCount: number
}

export interface MessagesResponse {
  messages: ChatMessage[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}

export interface CreateConversationRequest {
  participantIds: string[]
  type?: 'private' | 'group'
  name?: string
}

export interface SendMessageRequest {
  content: string
  type?: 'text' | 'emoji' | 'system' | 'image'
}

export interface PaginationParams {
  limit?: number
  cursor?: string
  before?: string
}

// User online status interfaces
export interface UserOnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen: string | null
  socketId?: string | null
  user?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }
}

export interface OnlineStatusResponse {
  success: boolean
  data: UserOnlineStatus[]
  timestamp: string
}