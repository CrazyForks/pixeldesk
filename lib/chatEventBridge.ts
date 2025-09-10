/**
 * Chat Event Bridge
 * 
 * This module creates a bridge between WebSocket chat events and the EventBus system.
 * It listens to WebSocket events from the ChatWebSocketClient and translates them
 * into EventBus events that can be consumed by React components and Phaser game logic.
 * 
 * @module ChatEventBridge
 */

import { EventBus } from './eventBus'
import { ChatWebSocketClient } from './websocketClient'
import type {
  ChatConversationOpenedEvent,
  ChatMessageReceivedEvent,
  ChatNotificationNewEvent,
  ChatUserTypingEvent,
  ChatUserOnlineEvent,
  ChatConnectionStatusEvent,
  ChatMessageSentEvent,
  ChatMessageStatusUpdatedEvent,
  ChatConversationUpdatedEvent,
  PlayerData
} from './eventBus'

/**
 * WebSocket message data interfaces
 */
interface WebSocketMessageData {
  message: {
    id: string
    conversationId: string
    senderId: string
    senderName: string
    senderAvatar?: string
    content: string
    type: 'text' | 'emoji' | 'system' | 'image'
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
    timestamp: string
    createdAt: string
    updatedAt: string
  }
  conversation?: {
    id: string
    type: 'private' | 'group'
    name?: string
    participants: any[]
    lastMessage?: any
    unreadCount: number
    updatedAt: string
    createdAt?: string
  }
}

interface WebSocketTypingData {
  userId: string
  conversationId: string
  userName?: string
}

interface WebSocketUserOnlineData {
  userId: string
  isOnline: boolean
  userName?: string
  avatar?: string
}

interface WebSocketMessageStatusData {
  messageId: string
  status: string
  conversationId: string
}

interface WebSocketConversationData {
  conversation: {
    id: string
    type: 'private' | 'group'
    name?: string
    participants: any[]
    lastMessage?: any
    unreadCount: number
    updatedAt: string
  }
}

/**
 * Chat Event Bridge Class
 * 
 * Manages the connection between WebSocket events and EventBus events
 */
export class ChatEventBridge {
  private wsClient: ChatWebSocketClient | null = null
  private isInitialized = false
  private eventHandlers: Map<string, (data: any) => void> = new Map()

  /**
   * Initialize the bridge with a WebSocket client
   */
  initialize(wsClient: ChatWebSocketClient): void {
    if (this.isInitialized) {
      console.warn('[ChatEventBridge] Already initialized')
      return
    }

    this.wsClient = wsClient
    this.setupEventHandlers()
    this.isInitialized = true
    
    console.log('[ChatEventBridge] Initialized successfully')
  }

  /**
   * Destroy the bridge and clean up event listeners
   */
  destroy(): void {
    if (!this.isInitialized || !this.wsClient) {
      return
    }

    // Remove all WebSocket event listeners
    this.eventHandlers.forEach((handler, event) => {
      this.wsClient!.off(event, handler)
    })

    this.eventHandlers.clear()
    this.wsClient = null
    this.isInitialized = false
    
    console.log('[ChatEventBridge] Destroyed successfully')
  }

  /**
   * Set up WebSocket event handlers and their EventBus translations
   */
  private setupEventHandlers(): void {
    if (!this.wsClient) return

    // Connection status events
    const connectedHandler = () => {
      const event: ChatConnectionStatusEvent = {
        type: 'chat:connection:status',
        timestamp: Date.now(),
        isConnected: true
      }
      EventBus.emit('chat:connection:status', event)
    }

    const disconnectedHandler = (data: { code: number; reason: string }) => {
      const event: ChatConnectionStatusEvent = {
        type: 'chat:connection:status',
        timestamp: Date.now(),
        isConnected: false
      }
      EventBus.emit('chat:connection:status', event)
    }

    const reconnectingHandler = (data: { attempt: number }) => {
      const event: ChatConnectionStatusEvent = {
        type: 'chat:connection:status',
        timestamp: Date.now(),
        isConnected: false,
        reconnectAttempts: data.attempt
      }
      EventBus.emit('chat:connection:status', event)
    }

    // Message events
    const messageReceivedHandler = (data: WebSocketMessageData) => {
      const event: ChatMessageReceivedEvent = {
        type: 'chat:message:received',
        timestamp: Date.now(),
        message: data.message,
        conversationId: data.message.conversationId
      }
      EventBus.emit('chat:message:received', event)

      // Also emit notification event for new messages
      const notificationEvent: ChatNotificationNewEvent = {
        type: 'chat:notification:new',
        timestamp: Date.now(),
        count: 1, // This should be updated by the notification system
        latestMessage: {
          id: data.message.id,
          conversationId: data.message.conversationId,
          senderId: data.message.senderId,
          senderName: data.message.senderName,
          content: data.message.content,
          timestamp: data.message.timestamp
        }
      }
      EventBus.emit('chat:notification:new', notificationEvent)
    }

    const messageSentHandler = (data: { message: any }) => {
      const event: ChatMessageSentEvent = {
        type: 'chat:message:sent',
        timestamp: Date.now(),
        message: {
          id: data.message.id,
          conversationId: data.message.conversationId,
          content: data.message.content,
          type: data.message.type,
          status: data.message.status,
          timestamp: data.message.timestamp
        }
      }
      EventBus.emit('chat:message:sent', event)
    }

    const messageStatusUpdatedHandler = (data: WebSocketMessageStatusData) => {
      const event: ChatMessageStatusUpdatedEvent = {
        type: 'chat:message:status:updated',
        timestamp: Date.now(),
        messageId: data.messageId,
        status: data.status,
        conversationId: data.conversationId
      }
      EventBus.emit('chat:message:status:updated', event)
    }

    // User presence events
    const userTypingHandler = (data: WebSocketTypingData) => {
      const event: ChatUserTypingEvent = {
        type: 'chat:user:typing',
        timestamp: Date.now(),
        userId: data.userId,
        conversationId: data.conversationId,
        isTyping: true
      }
      EventBus.emit('chat:user:typing', event)
    }

    const userOnlineHandler = (data: WebSocketUserOnlineData) => {
      const event: ChatUserOnlineEvent = {
        type: 'chat:user:online',
        timestamp: Date.now(),
        userId: data.userId,
        isOnline: data.isOnline
      }
      EventBus.emit('chat:user:online', event)
    }

    // Conversation events
    const conversationUpdatedHandler = (data: WebSocketConversationData) => {
      const event: ChatConversationUpdatedEvent = {
        type: 'chat:conversation:updated',
        timestamp: Date.now(),
        conversation: data.conversation
      }
      EventBus.emit('chat:conversation:updated', event)
    }

    // Register all handlers with WebSocket client
    this.wsClient.on('connected', connectedHandler)
    this.wsClient.on('disconnected', disconnectedHandler)
    this.wsClient.on('reconnecting', reconnectingHandler)
    this.wsClient.on('message_received', messageReceivedHandler)
    this.wsClient.on('message_sent', messageSentHandler)
    this.wsClient.on('message_status_updated', messageStatusUpdatedHandler)
    this.wsClient.on('user_typing', userTypingHandler)
    this.wsClient.on('user_online', userOnlineHandler)
    this.wsClient.on('conversation_status', conversationUpdatedHandler)

    // Store handlers for cleanup
    this.eventHandlers.set('connected', connectedHandler)
    this.eventHandlers.set('disconnected', disconnectedHandler)
    this.eventHandlers.set('reconnecting', reconnectingHandler)
    this.eventHandlers.set('message_received', messageReceivedHandler)
    this.eventHandlers.set('message_sent', messageSentHandler)
    this.eventHandlers.set('message_status_updated', messageStatusUpdatedHandler)
    this.eventHandlers.set('user_typing', userTypingHandler)
    this.eventHandlers.set('user_online', userOnlineHandler)
    this.eventHandlers.set('conversation_status', conversationUpdatedHandler)

    console.log('[ChatEventBridge] Event handlers set up successfully')
  }

  /**
   * Emit a conversation opened event (called from UI components)
   */
  emitConversationOpened(conversationId: string, participant: PlayerData): void {
    const event: ChatConversationOpenedEvent = {
      type: 'chat:conversation:opened',
      timestamp: Date.now(),
      conversationId,
      participant
    }
    EventBus.emit('chat:conversation:opened', event)
  }

  /**
   * Emit a typing stopped event (WebSocket doesn't send explicit stop events)
   */
  emitTypingStopped(userId: string, conversationId: string): void {
    const event: ChatUserTypingEvent = {
      type: 'chat:user:typing',
      timestamp: Date.now(),
      userId,
      conversationId,
      isTyping: false
    }
    EventBus.emit('chat:user:typing', event)
  }

  /**
   * Get initialization status
   */
  get initialized(): boolean {
    return this.isInitialized
  }

  /**
   * Get WebSocket client reference
   */
  get webSocketClient(): ChatWebSocketClient | null {
    return this.wsClient
  }
}

// Create singleton instance
export const chatEventBridge = new ChatEventBridge()

// Export for global access
declare global {
  interface Window {
    chatEventBridge: ChatEventBridge
  }
}

if (typeof window !== 'undefined') {
  window.chatEventBridge = chatEventBridge
}

export default chatEventBridge