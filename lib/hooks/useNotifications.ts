import { useState, useEffect, useCallback } from 'react'
import { notificationManager, NotificationState } from '../notificationManager'
import { ChatNotification, ChatMessage } from '../../types/chat'

export interface UseNotificationsOptions {
  autoSync?: boolean
  syncInterval?: number
}

export interface UseNotificationsReturn {
  notifications: ChatNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  // Actions
  addNotification: (message: ChatMessage, conversationId: string) => void
  markAsRead: (notificationIds: string[]) => Promise<void>
  markConversationAsRead: (conversationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotifications: (notificationIds: string[]) => void
  clearConversationNotifications: (conversationId: string) => void
  clearAll: () => void
  clearOldNotifications: (olderThanDays?: number) => void
  syncWithServer: () => Promise<void>
  
  // Getters
  getUnreadNotifications: () => ChatNotification[]
  getConversationNotifications: (conversationId: string) => ChatNotification[]
  getConversationUnreadCount: (conversationId: string) => number
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoSync = true, syncInterval = 30000 } = options
  
  const [state, setState] = useState<NotificationState>(() => notificationManager.getState())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to notification manager changes
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setState)
    return unsubscribe
  }, [])

  // Auto-sync with server
  useEffect(() => {
    if (!autoSync) return

    const sync = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await notificationManager.syncWithServer()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to sync notifications')
      } finally {
        setIsLoading(false)
      }
    }

    // Initial sync
    sync()

    // Set up interval sync
    const interval = setInterval(sync, syncInterval)

    return () => clearInterval(interval)
  }, [autoSync, syncInterval])

  // Actions
  const addNotification = useCallback((message: ChatMessage, conversationId: string) => {
    notificationManager.addNotification(message, conversationId)
  }, [])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      setError(null)
      notificationManager.markAsRead(notificationIds)
      
      // Get conversation IDs for server sync
      const notifications = notificationManager.getNotifications()
      const conversationIds = Array.from(new Set(
        notificationIds
          .map(id => notifications.find(n => n.id === id)?.conversationId)
          .filter(Boolean) as string[]
      ))
      
      if (conversationIds.length > 0) {
        await notificationManager.markAsReadOnServer(conversationIds)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notifications as read')
      throw err
    }
  }, [])

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      setError(null)
      notificationManager.markConversationAsRead(conversationId)
      await notificationManager.markAsReadOnServer([conversationId])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark conversation as read')
      throw err
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      setError(null)
      notificationManager.markAllAsRead()
      await notificationManager.markAsReadOnServer(undefined, true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
      throw err
    }
  }, [])

  const removeNotifications = useCallback((notificationIds: string[]) => {
    notificationManager.removeNotifications(notificationIds)
  }, [])

  const clearConversationNotifications = useCallback((conversationId: string) => {
    notificationManager.clearConversationNotifications(conversationId)
  }, [])

  const clearAll = useCallback(() => {
    notificationManager.clearAll()
  }, [])

  const clearOldNotifications = useCallback((olderThanDays: number = 7) => {
    notificationManager.clearOldNotifications(olderThanDays)
  }, [])

  const syncWithServer = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      await notificationManager.syncWithServer()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync with server')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Getters
  const getUnreadNotifications = useCallback(() => {
    return notificationManager.getUnreadNotifications()
  }, [state.notifications])

  const getConversationNotifications = useCallback((conversationId: string) => {
    return notificationManager.getConversationNotifications(conversationId)
  }, [state.notifications])

  const getConversationUnreadCount = useCallback((conversationId: string) => {
    return notificationManager.getConversationUnreadCount(conversationId)
  }, [state.notifications])

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading,
    error,
    
    // Actions
    addNotification,
    markAsRead,
    markConversationAsRead,
    markAllAsRead,
    removeNotifications,
    clearConversationNotifications,
    clearAll,
    clearOldNotifications,
    syncWithServer,
    
    // Getters
    getUnreadNotifications,
    getConversationNotifications,
    getConversationUnreadCount
  }
}