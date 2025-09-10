import { ChatNotification, ChatMessage } from '../types/chat'

export interface NotificationManagerOptions {
  maxNotifications?: number
  autoMarkReadDelay?: number
  persistToStorage?: boolean
}

export interface NotificationState {
  notifications: ChatNotification[]
  unreadCount: number
  lastUpdated: string
}

export class NotificationManager {
  private notifications: Map<string, ChatNotification> = new Map()
  private listeners: Set<(state: NotificationState) => void> = new Set()
  private options: Required<NotificationManagerOptions>
  private storageKey = 'chat_notifications'

  constructor(options: NotificationManagerOptions = {}) {
    this.options = {
      maxNotifications: options.maxNotifications || 100,
      autoMarkReadDelay: options.autoMarkReadDelay || 5000,
      persistToStorage: options.persistToStorage ?? true
    }

    // Load from localStorage if enabled
    if (this.options.persistToStorage && typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  /**
   * Add a new notification
   */
  addNotification(message: ChatMessage, conversationId: string): void {
    const notification: ChatNotification = {
      id: `notif_${message.id}_${Date.now()}`,
      conversationId,
      messageId: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.createdAt,
      isRead: false
    }

    this.notifications.set(notification.id, notification)
    this.trimNotifications()
    this.persistToStorage()
    this.notifyListeners()
  }

  /**
   * Mark specific notifications as read
   */
  markAsRead(notificationIds: string[]): void {
    let hasChanges = false

    notificationIds.forEach(id => {
      const notification = this.notifications.get(id)
      if (notification && !notification.isRead) {
        this.notifications.set(id, { ...notification, isRead: true })
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.persistToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Mark all notifications for a conversation as read
   */
  markConversationAsRead(conversationId: string): void {
    let hasChanges = false

    this.notifications.forEach((notification, id) => {
      if (notification.conversationId === conversationId && !notification.isRead) {
        this.notifications.set(id, { ...notification, isRead: true })
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.persistToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    let hasChanges = false

    this.notifications.forEach((notification, id) => {
      if (!notification.isRead) {
        this.notifications.set(id, { ...notification, isRead: true })
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.persistToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Remove specific notifications
   */
  removeNotifications(notificationIds: string[]): void {
    let hasChanges = false

    notificationIds.forEach(id => {
      if (this.notifications.has(id)) {
        this.notifications.delete(id)
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.persistToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Clear all notifications for a conversation
   */
  clearConversationNotifications(conversationId: string): void {
    const toRemove: string[] = []

    this.notifications.forEach((notification, id) => {
      if (notification.conversationId === conversationId) {
        toRemove.push(id)
      }
    })

    if (toRemove.length > 0) {
      this.removeNotifications(toRemove)
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    if (this.notifications.size > 0) {
      this.notifications.clear()
      this.persistToStorage()
      this.notifyListeners()
    }
  }

  /**
   * Clear old notifications (older than specified days)
   */
  clearOldNotifications(olderThanDays: number = 7): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
    
    const toRemove: string[] = []

    this.notifications.forEach((notification, id) => {
      const notificationDate = new Date(notification.timestamp)
      if (notificationDate < cutoffDate) {
        toRemove.push(id)
      }
    })

    if (toRemove.length > 0) {
      this.removeNotifications(toRemove)
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): ChatNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): ChatNotification[] {
    return this.getNotifications().filter(n => !n.isRead)
  }

  /**
   * Get notifications for a specific conversation
   */
  getConversationNotifications(conversationId: string): ChatNotification[] {
    return this.getNotifications().filter(n => n.conversationId === conversationId)
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnreadNotifications().length
  }

  /**
   * Get unread count for a specific conversation
   */
  getConversationUnreadCount(conversationId: string): number {
    return this.getConversationNotifications(conversationId).filter(n => !n.isRead).length
  }

  /**
   * Get current state
   */
  getState(): NotificationState {
    return {
      notifications: this.getNotifications(),
      unreadCount: this.getUnreadCount(),
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: NotificationState) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Sync with server notifications
   */
  async syncWithServer(): Promise<void> {
    try {
      const response = await fetch('/api/chat/notifications')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.notifications) {
          // Replace local notifications with server data
          this.notifications.clear()
          data.notifications.forEach((notification: ChatNotification) => {
            this.notifications.set(notification.id, notification)
          })
          this.persistToStorage()
          this.notifyListeners()
        }
      }
    } catch (error) {
      console.error('Failed to sync notifications with server:', error)
    }
  }

  /**
   * Mark notifications as read on server
   */
  async markAsReadOnServer(conversationIds?: string[], markAll: boolean = false): Promise<void> {
    try {
      const response = await fetch('/api/chat/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationIds,
          markAll
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read on server')
      }
    } catch (error) {
      console.error('Failed to mark notifications as read on server:', error)
      throw error
    }
  }

  /**
   * Clear old notifications on server
   */
  async clearOldNotificationsOnServer(olderThanDays: number = 30): Promise<void> {
    try {
      const response = await fetch(`/api/chat/notifications?olderThanDays=${olderThanDays}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to clear old notifications on server')
      }
    } catch (error) {
      console.error('Failed to clear old notifications on server:', error)
      throw error
    }
  }

  private trimNotifications(): void {
    const notifications = this.getNotifications()
    if (notifications.length > this.options.maxNotifications) {
      // Remove oldest notifications
      const toRemove = notifications
        .slice(this.options.maxNotifications)
        .map(n => n.id)
      
      toRemove.forEach(id => this.notifications.delete(id))
    }
  }

  private persistToStorage(): void {
    if (this.options.persistToStorage && typeof window !== 'undefined') {
      try {
        const state = this.getState()
        localStorage.setItem(this.storageKey, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to persist notifications to storage:', error)
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const state: NotificationState = JSON.parse(stored)
        this.notifications.clear()
        state.notifications.forEach(notification => {
          this.notifications.set(notification.id, notification)
        })
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error)
    }
  }

  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })
  }
}

// Create a singleton instance
export const notificationManager = new NotificationManager()