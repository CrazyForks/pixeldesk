interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  code?: string;
  timestamp?: string;
}

interface WebSocketConfig {
  url: string;
  token: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

type EventHandler = (data: any) => void;

interface QueuedMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private messageQueue: QueuedMessage[] = [];
  private messageIdCounter = 0;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.isManuallyDisconnected = false;

      const wsUrl = `${this.config.url}?token=${encodeURIComponent(this.config.token)}`;
      
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          
          // Process any queued messages
          setTimeout(() => this.processMessageQueue(), 100);
          
          this.emit('connected', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          if (!this.isManuallyDisconnected) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', { error });
          
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(type: string, data?: any, options?: { queue?: boolean; maxRetries?: number }): boolean {
    const { queue = true, maxRetries = 3 } = options || {};

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (queue && !this.isManuallyDisconnected) {
        // Queue message for later sending
        this.queueMessage(type, data, maxRetries);
        console.log('WebSocket not connected, message queued:', type);
        return true;
      } else {
        console.warn('WebSocket not connected, cannot send message:', type);
        return false;
      }
    }

    try {
      const message = { type, ...data };
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      
      if (queue && !this.isManuallyDisconnected) {
        this.queueMessage(type, data, maxRetries);
      }
      
      return false;
    }
  }

  /**
   * Queue message for retry
   */
  private queueMessage(type: string, data: any, maxRetries: number): void {
    const messageId = `msg_${++this.messageIdCounter}_${Date.now()}`;
    
    const queuedMessage: QueuedMessage = {
      id: messageId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.messageQueue.push(queuedMessage);
    
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift(); // Remove oldest message
    }

    this.emit('message_queued', { messageId, type });
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    const messagesToRetry = [...this.messageQueue];
    this.messageQueue = [];

    messagesToRetry.forEach(queuedMessage => {
      if (queuedMessage.retryCount < queuedMessage.maxRetries) {
        queuedMessage.retryCount++;
        
        const success = this.send(queuedMessage.type, queuedMessage.data, { queue: false });
        
        if (!success) {
          // Re-queue if still failing
          this.messageQueue.push(queuedMessage);
        } else {
          this.emit('message_retry_success', { 
            messageId: queuedMessage.id, 
            retryCount: queuedMessage.retryCount 
          });
        }
      } else {
        // Max retries exceeded
        this.emit('message_retry_failed', { 
          messageId: queuedMessage.id, 
          type: queuedMessage.type,
          maxRetries: queuedMessage.maxRetries 
        });
      }
    });
  }

  /**
   * Add event listener
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    try {
      switch (message.type) {
        case 'connection_established':
          this.emit('connection_established', message.data);
          break;
        
        case 'pong':
          // Heartbeat response - update last activity
          this.lastHeartbeat = Date.now();
          break;
        
        case 'error':
          console.error('WebSocket server error:', message);
          this.emit('error', {
            message: message.message,
            code: message.code,
            retryable: (message as any).retryable
          });
          
          // Handle specific error types
          if (message.code === 'RATE_LIMIT_EXCEEDED') {
            this.emit('rate_limit_exceeded', message);
          } else if (message.code === 'UNAUTHORIZED') {
            this.emit('unauthorized', message);
            // Don't reconnect for auth errors
            this.isManuallyDisconnected = true;
          }
          break;
        
        case 'room_joined':
          this.emit('room_joined', message.data);
          break;
        
        case 'room_left':
          this.emit('room_left', message.data);
          break;
        
        case 'user_online':
          this.emit('user_online', message.data);
          break;
        
        case 'message_received':
          this.emit('message_received', message.data);
          break;
        
        case 'message_sent':
          this.emit('message_sent', message.data);
          break;
        
        case 'message_status_updated':
          this.emit('message_status_updated', message.data);
          break;
        
        case 'messages_marked_read':
          this.emit('messages_marked_read', message.data);
          break;
        
        case 'message_read_receipt':
          this.emit('message_read_receipt', message.data);
          break;
        
        case 'user_typing':
          this.emit('user_typing', message.data);
          break;
        
        case 'user_joined_room':
          this.emit('user_joined_room', message.data);
          break;
        
        case 'user_left_room':
          this.emit('user_left_room', message.data);
          break;
        
        case 'conversation_status':
          this.emit('conversation_status', message.data);
          break;
        
        default:
          // Emit the message type as event
          this.emit(message.type, message.data || message);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.emit('message_handling_error', { error, message });
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send('ping');
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached', {});
      return;
    }

    this.clearReconnectTimer();
    
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  get readyState(): number | null {
    return this.ws?.readyState || null;
  }

  /**
   * Send a chat message
   */
  sendMessage(conversationId: string, content: string, type: string = 'text'): boolean {
    return this.send('send_message', { conversationId, content, type });
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string): boolean {
    return this.send('typing_start', { conversationId });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): boolean {
    return this.send('typing_stop', { conversationId });
  }

  /**
   * Mark message as read
   */
  markAsRead(conversationId: string, messageId: string): boolean {
    return this.send('mark_read', { conversationId, messageId });
  }

  /**
   * Join a conversation room
   */
  joinRoom(conversationId: string): boolean {
    return this.send('join_room', { conversationId });
  }

  /**
   * Leave a conversation room
   */
  leaveRoom(conversationId: string): boolean {
    return this.send('leave_room', { conversationId });
  }

  /**
   * Get conversation status (participants, typing indicators, etc.)
   */
  getConversationStatus(conversationId: string): boolean {
    return this.send('get_conversation_status', { conversationId });
  }

  /**
   * Get queued message count
   */
  get queuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearMessageQueue(): void {
    const clearedCount = this.messageQueue.length;
    this.messageQueue = [];
    this.emit('message_queue_cleared', { clearedCount });
  }

  /**
   * Get connection health info
   */
  getConnectionHealth(): {
    isConnected: boolean;
    readyState: number | null;
    reconnectAttempts: number;
    queuedMessages: number;
    lastHeartbeat: number | null;
  } {
    return {
      isConnected: this.isConnected,
      readyState: this.readyState,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  private lastHeartbeat: number | null = null;
}

// Singleton instance for global use
let chatWebSocketClient: ChatWebSocketClient | null = null;

export function getChatWebSocketClient(token?: string): ChatWebSocketClient | null {
  if (!chatWebSocketClient && token) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/chat/ws`;
    
    chatWebSocketClient = new ChatWebSocketClient({
      url: wsUrl,
      token
    });
  }
  
  return chatWebSocketClient;
}

export function disconnectChatWebSocket(): void {
  if (chatWebSocketClient) {
    chatWebSocketClient.disconnect();
    chatWebSocketClient = null;
  }
}

/**
 * Initialize chat WebSocket with EventBus integration
 */
export async function initializeChatWebSocketWithEventBridge(token: string): Promise<ChatWebSocketClient> {
  // Lazy import to avoid circular dependencies
  const { chatEventBridge } = await import('./chatEventBridge');
  
  const client = getChatWebSocketClient(token);
  if (!client) {
    throw new Error('Failed to create WebSocket client');
  }

  // Initialize the event bridge
  if (!chatEventBridge.initialized) {
    chatEventBridge.initialize(client);
  }

  return client;
}

/**
 * Disconnect chat WebSocket and clean up EventBus integration
 */
export async function disconnectChatWebSocketWithEventBridge(): Promise<void> {
  // Lazy import to avoid circular dependencies
  const { chatEventBridge } = await import('./chatEventBridge');
  
  // Clean up event bridge
  if (chatEventBridge.initialized) {
    chatEventBridge.destroy();
  }

  // Disconnect WebSocket
  disconnectChatWebSocket();
}