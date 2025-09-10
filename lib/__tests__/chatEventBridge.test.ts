/**
 * Chat Event Bridge Tests
 * 
 * Tests for the ChatEventBridge functionality to ensure proper
 * integration between WebSocket events and EventBus.
 */

import { EventBus } from '../eventBus'
import { ChatEventBridge } from '../chatEventBridge'
import { ChatWebSocketClient } from '../websocketClient'

// Mock WebSocket
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = WebSocket.CONNECTING

  send = jest.fn()
  close = jest.fn()

  // Helper methods for testing
  simulateOpen() {
    this.readyState = WebSocket.OPEN
    if (this.onopen) {
      this.onopen(new Event('open'))
    }
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }))
    }
  }

  simulateClose() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: 1000, reason: 'Test close' }))
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any

describe('ChatEventBridge', () => {
  let bridge: ChatEventBridge
  let mockWsClient: ChatWebSocketClient
  let mockWebSocket: MockWebSocket

  beforeEach(() => {
    // Reset EventBus
    EventBus.removeAllListeners()
    
    // Create new bridge instance
    bridge = new ChatEventBridge()
    
    // Create WebSocket client with mock
    mockWsClient = new ChatWebSocketClient({
      url: 'ws://localhost:3000',
      token: 'test-token'
    })

    // Get reference to mock WebSocket
    mockWebSocket = (mockWsClient as any).ws as MockWebSocket
  })

  afterEach(() => {
    bridge.destroy()
    EventBus.removeAllListeners()
  })

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(bridge.initialized).toBe(false)
      
      bridge.initialize(mockWsClient)
      
      expect(bridge.initialized).toBe(true)
      expect(bridge.webSocketClient).toBe(mockWsClient)
    })

    test('should not initialize twice', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      bridge.initialize(mockWsClient)
      bridge.initialize(mockWsClient) // Second initialization
      
      expect(consoleSpy).toHaveBeenCalledWith('[ChatEventBridge] Already initialized')
      consoleSpy.mockRestore()
    })
  })

  describe('Event Translation', () => {
    beforeEach(() => {
      bridge.initialize(mockWsClient)
    })

    test('should translate WebSocket connection events to EventBus', (done) => {
      EventBus.on('chat:connection:status', (event) => {
        expect(event.type).toBe('chat:connection:status')
        expect(event.isConnected).toBe(true)
        expect(event.timestamp).toBeGreaterThan(0)
        done()
      })

      // Simulate WebSocket connection
      mockWebSocket.simulateOpen()
    })

    test('should translate message received events', (done) => {
      const testMessage = {
        message: {
          id: 'msg-123',
          conversationId: 'conv-456',
          senderId: 'user-789',
          senderName: 'Test User',
          content: 'Hello World',
          type: 'text',
          status: 'sent',
          timestamp: '2023-01-01T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      }

      EventBus.on('chat:message:received', (event) => {
        expect(event.type).toBe('chat:message:received')
        expect(event.message.id).toBe('msg-123')
        expect(event.conversationId).toBe('conv-456')
        done()
      })

      // Simulate WebSocket message
      mockWebSocket.simulateMessage({
        type: 'message_received',
        data: testMessage
      })
    })

    test('should translate user typing events', (done) => {
      const testTypingData = {
        userId: 'user-123',
        conversationId: 'conv-456',
        userName: 'Test User'
      }

      EventBus.on('chat:user:typing', (event) => {
        expect(event.type).toBe('chat:user:typing')
        expect(event.userId).toBe('user-123')
        expect(event.conversationId).toBe('conv-456')
        expect(event.isTyping).toBe(true)
        done()
      })

      // Simulate WebSocket typing event
      mockWebSocket.simulateMessage({
        type: 'user_typing',
        data: testTypingData
      })
    })

    test('should translate user online events', (done) => {
      const testOnlineData = {
        userId: 'user-123',
        isOnline: true,
        userName: 'Test User'
      }

      EventBus.on('chat:user:online', (event) => {
        expect(event.type).toBe('chat:user:online')
        expect(event.userId).toBe('user-123')
        expect(event.isOnline).toBe(true)
        done()
      })

      // Simulate WebSocket online event
      mockWebSocket.simulateMessage({
        type: 'user_online',
        data: testOnlineData
      })
    })
  })

  describe('Event Emission', () => {
    beforeEach(() => {
      bridge.initialize(mockWsClient)
    })

    test('should emit conversation opened events', (done) => {
      const testParticipant = {
        id: 'user-123',
        name: 'Test User',
        currentStatus: {
          type: 'work',
          status: 'available',
          emoji: '💼',
          message: 'Working',
          timestamp: '2023-01-01T00:00:00Z'
        },
        isOnline: true
      }

      EventBus.on('chat:conversation:opened', (event) => {
        expect(event.type).toBe('chat:conversation:opened')
        expect(event.conversationId).toBe('conv-123')
        expect(event.participant.id).toBe('user-123')
        done()
      })

      bridge.emitConversationOpened('conv-123', testParticipant)
    })

    test('should emit typing stopped events', (done) => {
      EventBus.on('chat:user:typing', (event) => {
        expect(event.type).toBe('chat:user:typing')
        expect(event.userId).toBe('user-123')
        expect(event.conversationId).toBe('conv-456')
        expect(event.isTyping).toBe(false)
        done()
      })

      bridge.emitTypingStopped('user-123', 'conv-456')
    })
  })

  describe('Cleanup', () => {
    test('should clean up properly on destroy', () => {
      bridge.initialize(mockWsClient)
      expect(bridge.initialized).toBe(true)
      
      bridge.destroy()
      
      expect(bridge.initialized).toBe(false)
      expect(bridge.webSocketClient).toBe(null)
    })

    test('should handle destroy when not initialized', () => {
      expect(() => bridge.destroy()).not.toThrow()
    })
  })
})

describe('EventBus Chat Events', () => {
  beforeEach(() => {
    EventBus.removeAllListeners()
  })

  afterEach(() => {
    EventBus.removeAllListeners()
  })

  test('should handle chat event subscriptions', () => {
    const handler = jest.fn()
    
    EventBus.on('chat:message:received', handler)
    
    const testEvent = {
      type: 'chat:message:received' as const,
      timestamp: Date.now(),
      message: {
        id: 'msg-123',
        conversationId: 'conv-456',
        senderId: 'user-789',
        senderName: 'Test User',
        content: 'Hello',
        type: 'text' as const,
        status: 'sent' as const,
        timestamp: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      conversationId: 'conv-456'
    }
    
    EventBus.emit('chat:message:received', testEvent)
    
    expect(handler).toHaveBeenCalledWith(testEvent)
  })

  test('should handle multiple chat event types', () => {
    const messageHandler = jest.fn()
    const typingHandler = jest.fn()
    const onlineHandler = jest.fn()
    
    EventBus.on('chat:message:received', messageHandler)
    EventBus.on('chat:user:typing', typingHandler)
    EventBus.on('chat:user:online', onlineHandler)
    
    // Emit different event types
    EventBus.emit('chat:message:received', {
      type: 'chat:message:received',
      timestamp: Date.now(),
      message: {} as any,
      conversationId: 'conv-123'
    })
    
    EventBus.emit('chat:user:typing', {
      type: 'chat:user:typing',
      timestamp: Date.now(),
      userId: 'user-123',
      conversationId: 'conv-123',
      isTyping: true
    })
    
    EventBus.emit('chat:user:online', {
      type: 'chat:user:online',
      timestamp: Date.now(),
      userId: 'user-123',
      isOnline: true
    })
    
    expect(messageHandler).toHaveBeenCalledTimes(1)
    expect(typingHandler).toHaveBeenCalledTimes(1)
    expect(onlineHandler).toHaveBeenCalledTimes(1)
  })
})