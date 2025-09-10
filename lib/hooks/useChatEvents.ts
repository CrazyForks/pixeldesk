/**
 * React Hook for Chat Events
 * 
 * This hook provides a convenient way for React components to subscribe to
 * chat events from the EventBus system. It handles event subscription,
 * cleanup, and provides typed event handlers.
 * 
 * @module useChatEvents
 */

import { useEffect, useCallback, useRef } from 'react'
import { EventBus } from '../eventBus'
import type {
  GameEvents,
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
} from '../eventBus'

/**
 * Chat event handlers interface
 */
export interface ChatEventHandlers {
  onConversationOpened?: (event: ChatConversationOpenedEvent) => void
  onMessageReceived?: (event: ChatMessageReceivedEvent) => void
  onNotificationNew?: (event: ChatNotificationNewEvent) => void
  onUserTyping?: (event: ChatUserTypingEvent) => void
  onUserOnline?: (event: ChatUserOnlineEvent) => void
  onConnectionStatus?: (event: ChatConnectionStatusEvent) => void
  onMessageSent?: (event: ChatMessageSentEvent) => void
  onMessageStatusUpdated?: (event: ChatMessageStatusUpdatedEvent) => void
  onConversationUpdated?: (event: ChatConversationUpdatedEvent) => void
}

/**
 * Chat event emitters interface
 */
export interface ChatEventEmitters {
  emitConversationOpened: (conversationId: string, participant: PlayerData) => void
  emitTypingStopped: (userId: string, conversationId: string) => void
}

/**
 * Hook return type
 */
export interface UseChatEventsReturn extends ChatEventEmitters {
  isConnected: boolean
  connectionAttempts: number
}

/**
 * React hook for subscribing to chat events
 * 
 * @param handlers - Object containing event handler functions
 * @returns Object with event emitters and connection status
 */
export function useChatEvents(handlers: ChatEventHandlers = {}): UseChatEventsReturn {
  const handlersRef = useRef(handlers)
  const connectionStatusRef = useRef({ isConnected: false, attempts: 0 })

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  // Set up event listeners
  useEffect(() => {
    const eventHandlers: Array<{ event: keyof GameEvents; handler: (data: any) => void }> = []

    // Conversation opened event
    if (handlersRef.current.onConversationOpened) {
      const handler = (event: ChatConversationOpenedEvent) => {
        handlersRef.current.onConversationOpened?.(event)
      }
      EventBus.on('chat:conversation:opened', handler)
      eventHandlers.push({ event: 'chat:conversation:opened', handler })
    }

    // Message received event
    if (handlersRef.current.onMessageReceived) {
      const handler = (event: ChatMessageReceivedEvent) => {
        handlersRef.current.onMessageReceived?.(event)
      }
      EventBus.on('chat:message:received', handler)
      eventHandlers.push({ event: 'chat:message:received', handler })
    }

    // New notification event
    if (handlersRef.current.onNotificationNew) {
      const handler = (event: ChatNotificationNewEvent) => {
        handlersRef.current.onNotificationNew?.(event)
      }
      EventBus.on('chat:notification:new', handler)
      eventHandlers.push({ event: 'chat:notification:new', handler })
    }

    // User typing event
    if (handlersRef.current.onUserTyping) {
      const handler = (event: ChatUserTypingEvent) => {
        handlersRef.current.onUserTyping?.(event)
      }
      EventBus.on('chat:user:typing', handler)
      eventHandlers.push({ event: 'chat:user:typing', handler })
    }

    // User online event
    if (handlersRef.current.onUserOnline) {
      const handler = (event: ChatUserOnlineEvent) => {
        handlersRef.current.onUserOnline?.(event)
      }
      EventBus.on('chat:user:online', handler)
      eventHandlers.push({ event: 'chat:user:online', handler })
    }

    // Connection status event
    const connectionHandler = (event: ChatConnectionStatusEvent) => {
      connectionStatusRef.current = {
        isConnected: event.isConnected,
        attempts: event.reconnectAttempts || 0
      }
      handlersRef.current.onConnectionStatus?.(event)
    }
    EventBus.on('chat:connection:status', connectionHandler)
    eventHandlers.push({ event: 'chat:connection:status', handler: connectionHandler })

    // Message sent event
    if (handlersRef.current.onMessageSent) {
      const handler = (event: ChatMessageSentEvent) => {
        handlersRef.current.onMessageSent?.(event)
      }
      EventBus.on('chat:message:sent', handler)
      eventHandlers.push({ event: 'chat:message:sent', handler })
    }

    // Message status updated event
    if (handlersRef.current.onMessageStatusUpdated) {
      const handler = (event: ChatMessageStatusUpdatedEvent) => {
        handlersRef.current.onMessageStatusUpdated?.(event)
      }
      EventBus.on('chat:message:status:updated', handler)
      eventHandlers.push({ event: 'chat:message:status:updated', handler })
    }

    // Conversation updated event
    if (handlersRef.current.onConversationUpdated) {
      const handler = (event: ChatConversationUpdatedEvent) => {
        handlersRef.current.onConversationUpdated?.(event)
      }
      EventBus.on('chat:conversation:updated', handler)
      eventHandlers.push({ event: 'chat:conversation:updated', handler })
    }

    // Cleanup function
    return () => {
      eventHandlers.forEach(({ event, handler }) => {
        EventBus.off(event, handler)
      })
    }
  }, []) // Empty dependency array since we use refs for handlers

  // Event emitter functions
  const emitConversationOpened = useCallback(async (conversationId: string, participant: PlayerData) => {
    try {
      // Lazy import to avoid circular dependencies
      const { chatEventBridge } = await import('../chatEventBridge')
      chatEventBridge.emitConversationOpened(conversationId, participant)
    } catch (error) {
      console.error('[useChatEvents] Error emitting conversation opened:', error)
    }
  }, [])

  const emitTypingStopped = useCallback(async (userId: string, conversationId: string) => {
    try {
      // Lazy import to avoid circular dependencies
      const { chatEventBridge } = await import('../chatEventBridge')
      chatEventBridge.emitTypingStopped(userId, conversationId)
    } catch (error) {
      console.error('[useChatEvents] Error emitting typing stopped:', error)
    }
  }, [])

  return {
    emitConversationOpened,
    emitTypingStopped,
    isConnected: connectionStatusRef.current.isConnected,
    connectionAttempts: connectionStatusRef.current.attempts
  }
}

/**
 * Simplified hook for just listening to specific chat events
 */
export function useChatEvent<K extends keyof Pick<GameEvents, 
  'chat:conversation:opened' | 'chat:message:received' | 'chat:notification:new' | 
  'chat:user:typing' | 'chat:user:online' | 'chat:connection:status' | 
  'chat:message:sent' | 'chat:message:status:updated' | 'chat:conversation:updated'
>>(
  event: K,
  handler: (data: GameEvents[K]) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    EventBus.on(event, handler)
    return () => EventBus.off(event, handler)
  }, deps)
}

/**
 * Hook for emitting chat events
 */
export function useChatEventEmitters(): ChatEventEmitters {
  const emitConversationOpened = useCallback(async (conversationId: string, participant: PlayerData) => {
    try {
      const { chatEventBridge } = await import('../chatEventBridge')
      chatEventBridge.emitConversationOpened(conversationId, participant)
    } catch (error) {
      console.error('[useChatEventEmitters] Error emitting conversation opened:', error)
    }
  }, [])

  const emitTypingStopped = useCallback(async (userId: string, conversationId: string) => {
    try {
      const { chatEventBridge } = await import('../chatEventBridge')
      chatEventBridge.emitTypingStopped(userId, conversationId)
    } catch (error) {
      console.error('[useChatEventEmitters] Error emitting typing stopped:', error)
    }
  }, [])

  return {
    emitConversationOpened,
    emitTypingStopped
  }
}