import { useState, useEffect, useCallback, useRef } from 'react'
import { UserOnlineStatus } from '../../types/chat'

interface UseOnlineStatusOptions {
  userIds: string[]
  refreshInterval?: number // in milliseconds
  autoRefresh?: boolean
}

interface UseOnlineStatusReturn {
  statuses: Map<string, UserOnlineStatus>
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  getStatus: (userId: string) => UserOnlineStatus | null
}

export function useOnlineStatus({
  userIds,
  refreshInterval = 30000, // 30 seconds default
  autoRefresh = true
}: UseOnlineStatusOptions): UseOnlineStatusReturn {
  const [statuses, setStatuses] = useState<Map<string, UserOnlineStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchStatuses = useCallback(async () => {
    if (userIds.length === 0) {
      setStatuses(new Map())
      setIsLoading(false)
      return
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    try {
      const userIdsParam = userIds.join(',')
      const response = await fetch(`/api/chat/users/online-status?userIds=${userIdsParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dummy-token'}`
        },
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        const statusMap = new Map<string, UserOnlineStatus>()
        
        data.data.forEach((status: UserOnlineStatus) => {
          statusMap.set(status.userId, status)
        })
        
        setStatuses(statusMap)
      } else {
        throw new Error(data.error || 'Failed to fetch online status')
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching online status:', error)
        setError(error.message || 'Failed to fetch online status')
      }
    } finally {
      setIsLoading(false)
    }
  }, [userIds])

  const refresh = useCallback(async () => {
    await fetchStatuses()
  }, [fetchStatuses])

  const getStatus = useCallback((userId: string): UserOnlineStatus | null => {
    return statuses.get(userId) || null
  }, [statuses])

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchStatuses()

    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(fetchStatuses, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchStatuses, autoRefresh, refreshInterval])

  // Update when userIds change
  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  return {
    statuses,
    isLoading,
    error,
    refresh,
    getStatus
  }
}

// Hook for single user online status
export function useSingleUserOnlineStatus(userId: string | null) {
  const { statuses, isLoading, error, refresh, getStatus } = useOnlineStatus({
    userIds: userId ? [userId] : [],
    refreshInterval: 30000,
    autoRefresh: true
  })

  return {
    status: userId ? getStatus(userId) : null,
    isLoading,
    error,
    refresh
  }
}