# Chat EventBus Integration

This document explains how the chat system integrates with the EventBus to provide seamless communication between WebSocket events, React components, and Phaser game logic.

## Overview

The chat EventBus integration consists of three main components:

1. **Extended EventBus** - New chat event types added to the existing EventBus system
2. **ChatEventBridge** - Translates WebSocket events to EventBus events
3. **React Hooks** - Convenient hooks for React components to use chat events

## Architecture

```
WebSocket Events → ChatEventBridge → EventBus → React Components
                                              → Phaser Game Logic
```

## New Chat Event Types

The following chat events have been added to the EventBus:

### Message Events
- `chat:message:received` - New message received
- `chat:message:sent` - Message successfully sent
- `chat:message:status:updated` - Message status changed (delivered, read, etc.)

### Conversation Events
- `chat:conversation:opened` - Conversation window opened
- `chat:conversation:updated` - Conversation metadata updated

### User Presence Events
- `chat:user:typing` - User started/stopped typing
- `chat:user:online` - User online status changed

### System Events
- `chat:connection:status` - WebSocket connection status changed
- `chat:notification:new` - New chat notification

## Usage Examples

### 1. Using the React Hook

```typescript
import { useChatEvents } from '../lib/hooks/useChatEvents'

function MyChatComponent() {
  const { emitConversationOpened, isConnected } = useChatEvents({
    onMessageReceived: (event) => {
      console.log('New message:', event.message.content)
      // Update your component state
    },
    onUserTyping: (event) => {
      console.log(`User ${event.userId} is typing: ${event.isTyping}`)
      // Show/hide typing indicator
    },
    onConnectionStatus: (event) => {
      console.log('Connection status:', event.isConnected)
      // Update connection indicator
    }
  })

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Your chat UI */}
    </div>
  )
}
```

### 2. Direct EventBus Usage

```typescript
import { EventBus } from '../lib/eventBus'

// Listen for chat events
EventBus.on('chat:message:received', (event) => {
  console.log('New message from:', event.message.senderName)
  console.log('Content:', event.message.content)
})

// Emit chat events
EventBus.emit('chat:conversation:opened', {
  type: 'chat:conversation:opened',
  timestamp: Date.now(),
  conversationId: 'conv-123',
  participant: {
    id: 'user-456',
    name: 'John Doe',
    // ... other player data
  }
})
```

### 3. Initializing the Chat System

```typescript
import { initializeChatWebSocketWithEventBridge } from '../lib/websocketClient'

async function setupChat(userToken: string) {
  try {
    // This automatically sets up the EventBridge
    const wsClient = await initializeChatWebSocketWithEventBridge(userToken)
    
    // Connect to WebSocket
    await wsClient.connect()
    
    console.log('Chat system ready!')
  } catch (error) {
    console.error('Failed to setup chat:', error)
  }
}
```

## Event Data Structures

### ChatMessageReceivedEvent
```typescript
{
  type: 'chat:message:received'
  timestamp: number
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
  conversationId: string
}
```

### ChatUserTypingEvent
```typescript
{
  type: 'chat:user:typing'
  timestamp: number
  userId: string
  conversationId: string
  isTyping: boolean
}
```

### ChatConnectionStatusEvent
```typescript
{
  type: 'chat:connection:status'
  timestamp: number
  isConnected: boolean
  reconnectAttempts?: number
}
```

## Integration with Existing Systems

### Player Interactions
The chat system automatically listens for `player:click` events and can open chat conversations:

```typescript
// This is handled automatically by ChatManager
EventBus.on('player:click', (event) => {
  if (event.targetPlayer) {
    // Opens chat conversation with clicked player
    openChatWithPlayer(event.targetPlayer)
  }
})
```

### Tab System Integration
Chat notifications integrate with the existing tab system:

```typescript
EventBus.on('chat:notification:new', (event) => {
  // Update tab badge count
  updateTabNotificationCount('chat', event.count)
})
```

## Error Handling

The EventBus integration includes comprehensive error handling:

```typescript
// Connection errors
EventBus.on('chat:connection:status', (event) => {
  if (!event.isConnected) {
    // Handle disconnection
    showConnectionError()
    
    if (event.reconnectAttempts) {
      showReconnectingMessage(event.reconnectAttempts)
    }
  }
})

// EventBus errors
EventBus.onError((error) => {
  console.error('EventBus error:', error)
  // Handle EventBus-specific errors
})
```

## Performance Considerations

1. **Event Debouncing**: Typing events are automatically debounced
2. **Memory Management**: Event listeners are properly cleaned up
3. **Lazy Loading**: ChatEventBridge is loaded only when needed

## Testing

The integration includes comprehensive tests:

```bash
# Run the verification script
node lib/verify-chat-events.js

# Check TypeScript compilation
npx tsc --noEmit lib/eventBus.ts lib/chatEventBridge.ts
```

## Best Practices

1. **Always clean up event listeners** in React components:
```typescript
useEffect(() => {
  const handler = (event) => { /* handle event */ }
  EventBus.on('chat:message:received', handler)
  
  return () => EventBus.off('chat:message:received', handler)
}, [])
```

2. **Use the React hooks** instead of direct EventBus access when possible
3. **Handle connection status** to provide good user experience
4. **Debounce frequent events** like typing indicators

## Troubleshooting

### Common Issues

1. **Events not firing**: Check if ChatEventBridge is initialized
2. **Memory leaks**: Ensure event listeners are cleaned up
3. **TypeScript errors**: Make sure all event data matches the interfaces

### Debug Mode

Enable EventBus debug mode for troubleshooting:

```typescript
EventBus.setDebugMode(true)
```

This will log all event emissions and subscriptions to the console.

## Migration Guide

If you're updating existing chat code:

1. Replace direct WebSocket event listeners with EventBus listeners
2. Use the new React hooks instead of custom event handling
3. Update event data structures to match the new interfaces
4. Initialize the ChatEventBridge when setting up WebSocket connections

## Future Enhancements

Planned improvements:
- Event persistence for offline scenarios
- Event replay functionality
- Advanced filtering and routing
- Performance metrics and monitoring