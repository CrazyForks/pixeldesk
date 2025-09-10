/**
 * Chat Event Bridge Usage Example
 * 
 * This file demonstrates how to use the ChatEventBridge to integrate
 * WebSocket chat events with the EventBus system.
 */

import { initializeChatWebSocketWithEventBridge, disconnectChatWebSocketWithEventBridge } from '../websocketClient'
import { EventBus } from '../eventBus'
import type { 
  ChatMessageReceivedEvent, 
  ChatUserTypingEvent, 
  ChatConnectionStatusEvent,
  PlayerData 
} from '../eventBus'

/**
 * Example: Initialize chat system with EventBus integration
 */
export async function initializeChatSystem(userToken: string): Promise<void> {
  try {
    console.log('Initializing chat system...')
    
    // Initialize WebSocket client with EventBus bridge
    const wsClient = await initializeChatWebSocketWithEventBridge(userToken)
    
    // Set up EventBus listeners for chat events
    setupChatEventListeners()
    
    // Connect to WebSocket server
    await wsClient.connect()
    
    console.log('Chat system initialized successfully')
  } catch (error) {
    console.error('Failed to initialize chat system:', error)
    throw error
  }
}

/**
 * Example: Set up EventBus listeners for chat events
 */
function setupChatEventListeners(): void {
  // Listen for new messages
  EventBus.on('chat:message:received', (event: ChatMessageReceivedEvent) => {
    console.log('New message received:', {
      from: event.message.senderName,
      content: event.message.content,
      conversation: event.conversationId
    })
    
    // Example: Show notification
    showMessageNotification(event.message.senderName, event.message.content)
    
    // Example: Update UI state
    updateConversationUI(event.conversationId, event.message)
  })
  
  // Listen for typing indicators
  EventBus.on('chat:user:typing', (event: ChatUserTypingEvent) => {
    console.log(`User ${event.userId} is ${event.isTyping ? 'typing' : 'stopped typing'} in conversation ${event.conversationId}`)
    
    // Example: Show/hide typing indicator
    updateTypingIndicator(event.conversationId, event.userId, event.isTyping)
  })
  
  // Listen for connection status changes
  EventBus.on('chat:connection:status', (event: ChatConnectionStatusEvent) => {
    console.log('Chat connection status:', event.isConnected ? 'Connected' : 'Disconnected')
    
    if (!event.isConnected && event.reconnectAttempts) {
      console.log(`Reconnection attempt ${event.reconnectAttempts}`)
    }
    
    // Example: Update connection indicator in UI
    updateConnectionStatus(event.isConnected, event.reconnectAttempts)
  })
  
  // Listen for user online status
  EventBus.on('chat:user:online', (event) => {
    console.log(`User ${event.userId} is now ${event.isOnline ? 'online' : 'offline'}`)
    
    // Example: Update user status in UI
    updateUserOnlineStatus(event.userId, event.isOnline)
  })
  
  // Listen for conversation opened events (from UI interactions)
  EventBus.on('chat:conversation:opened', (event) => {
    console.log(`Conversation opened with ${event.participant.name}`)
    
    // Example: Focus conversation window
    focusConversationWindow(event.conversationId)
  })
  
  // Listen for player clicks to start conversations
  EventBus.on('player:click', (event) => {
    if (event.targetPlayer) {
      console.log(`Player clicked: ${event.targetPlayer.name}`)
      
      // Example: Open chat conversation
      openChatWithPlayer(event.targetPlayer)
    }
  })
}

/**
 * Example: Open chat conversation with a player
 */
async function openChatWithPlayer(player: PlayerData): Promise<void> {
  try {
    // Create or get existing conversation
    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'private',
        participantIds: [player.id]
      })
    })
    
    if (response.ok) {
      const { conversation } = await response.json()
      
      // Emit conversation opened event through EventBus
      EventBus.emit('chat:conversation:opened', {
        type: 'chat:conversation:opened',
        timestamp: Date.now(),
        conversationId: conversation.id,
        participant: player
      })
    }
  } catch (error) {
    console.error('Failed to open chat with player:', error)
  }
}

/**
 * Example: Clean up chat system
 */
export async function cleanupChatSystem(): Promise<void> {
  try {
    console.log('Cleaning up chat system...')
    
    // Remove all EventBus listeners
    EventBus.removeAllListeners('chat:message:received')
    EventBus.removeAllListeners('chat:user:typing')
    EventBus.removeAllListeners('chat:connection:status')
    EventBus.removeAllListeners('chat:user:online')
    EventBus.removeAllListeners('chat:conversation:opened')
    
    // Disconnect WebSocket with EventBus cleanup
    await disconnectChatWebSocketWithEventBridge()
    
    console.log('Chat system cleaned up successfully')
  } catch (error) {
    console.error('Error cleaning up chat system:', error)
  }
}

// Example UI update functions (these would be implemented based on your UI framework)

function showMessageNotification(senderName: string, content: string): void {
  // Example: Show browser notification or in-app notification
  console.log(`Notification: ${senderName}: ${content}`)
}

function updateConversationUI(conversationId: string, message: any): void {
  // Example: Update conversation window with new message
  console.log(`Update conversation ${conversationId} with message:`, message)
}

function updateTypingIndicator(conversationId: string, userId: string, isTyping: boolean): void {
  // Example: Show/hide typing indicator in conversation window
  console.log(`${isTyping ? 'Show' : 'Hide'} typing indicator for user ${userId} in conversation ${conversationId}`)
}

function updateConnectionStatus(isConnected: boolean, reconnectAttempts?: number): void {
  // Example: Update connection status indicator
  console.log(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}${reconnectAttempts ? ` (attempt ${reconnectAttempts})` : ''}`)
}

function updateUserOnlineStatus(userId: string, isOnline: boolean): void {
  // Example: Update user avatar or status indicator
  console.log(`User ${userId} status: ${isOnline ? 'online' : 'offline'}`)
}

function focusConversationWindow(conversationId: string): void {
  // Example: Bring conversation window to front
  console.log(`Focus conversation window: ${conversationId}`)
}

/**
 * Example: React component integration
 */
export const ChatSystemExample = `
import React, { useEffect } from 'react'
import { useChatEvents } from '../lib/hooks/useChatEvents'

export function MyChatComponent({ currentUserId }: { currentUserId: string }) {
  const { emitConversationOpened, isConnected } = useChatEvents({
    onMessageReceived: (event) => {
      console.log('New message:', event.message.content)
      // Update your component state here
    },
    onUserTyping: (event) => {
      console.log('User typing:', event.userId, event.isTyping)
      // Show/hide typing indicator
    },
    onConnectionStatus: (event) => {
      console.log('Connection:', event.isConnected)
      // Update connection status in UI
    }
  })

  const handlePlayerClick = (player: PlayerData) => {
    // This will emit the event through EventBus
    emitConversationOpened('conversation-id', player)
  }

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Your chat UI here */}
    </div>
  )
}
`