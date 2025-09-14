'use client'

import { useState, useEffect } from 'react'
import UserAvatar from './UserAvatar'
import LastSeenDisplay from './LastSeenDisplay'
import { ConversationParticipant } from '../types/chat'

interface UserOnlineStatus {
  userId: string
  isOnline: boolean
  lastSeen: string | null
}

interface ConversationParticipantStatusProps {
  participants: ConversationParticipant[]
  currentUserId: string
  showAvatars?: boolean
  showLastSeen?: boolean
  maxVisible?: number
  layout?: 'horizontal' | 'vertical' | 'grid'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  onParticipantClick?: (participant: ConversationParticipant) => void
}

export default function ConversationParticipantStatus({
  participants,
  currentUserId,
  showAvatars = true,
  showLastSeen = true,
  maxVisible = 5,
  layout = 'horizontal',
  size = 'md',
  className = '',
  onParticipantClick
}: ConversationParticipantStatusProps) {
  const [onlineStatuses, setOnlineStatuses] = useState<Map<string, UserOnlineStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Filter out current user from participants
  const otherParticipants = participants.filter(p => p.userId !== currentUserId && p.isActive)
  const visibleParticipants = otherParticipants.slice(0, maxVisible)
  const hiddenCount = Math.max(0, otherParticipants.length - maxVisible)

  // Fetch online status for participants
  useEffect(() => {
    const fetchOnlineStatus = async () => {
      if (otherParticipants.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        const userIds = otherParticipants.map(p => p.userId).join(',')
        const response = await fetch(`/api/chat/users/online-status?userIds=${userIds}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'dummy-token'}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          const statusMap = new Map<string, UserOnlineStatus>()
          
          data.data?.forEach((status: any) => {
            statusMap.set(status.userId, {
              userId: status.userId,
              isOnline: status.isOnline,
              lastSeen: status.lastSeen
            })
          })
          
          setOnlineStatuses(statusMap)
        }
      } catch (error) {
        console.error('Failed to fetch online status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOnlineStatus()

    // 禁用高频轮询，只在用户手动刷新时更新
    // const interval = setInterval(fetchOnlineStatus, 30000)
    // return () => clearInterval(interval)
  }, [otherParticipants])

  const getParticipantStatus = (participant: ConversationParticipant) => {
    const status = onlineStatuses.get(participant.userId)
    return {
      isOnline: status?.isOnline || false,
      lastSeen: status?.lastSeen || null
    }
  }

  const layoutClasses = {
    horizontal: 'flex items-center space-x-2',
    vertical: 'flex flex-col space-y-2',
    grid: 'grid grid-cols-2 gap-2'
  }

  if (isLoading) {
    return (
      <div className={`${layoutClasses[layout]} ${className}`}>
        {Array.from({ length: Math.min(3, otherParticipants.length) }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            {showAvatars && (
              <div className="w-8 h-8 bg-retro-border/30 rounded-full animate-pulse" />
            )}
            <div className="h-4 bg-retro-border/30 rounded animate-pulse w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (otherParticipants.length === 0) {
    return (
      <div className={`text-retro-textMuted text-sm ${className}`}>
        只有你一个人
      </div>
    )
  }

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {visibleParticipants.map((participant) => {
        const status = getParticipantStatus(participant)
        
        return (
          <div 
            key={participant.id}
            className={`flex items-center space-x-2 ${
              onParticipantClick ? 'cursor-pointer hover:bg-retro-border/20 rounded-lg p-1 transition-colors' : ''
            }`}
            onClick={() => onParticipantClick?.(participant)}
          >
            {showAvatars && (
              <UserAvatar
                userId={participant.userId}
                userName={participant.userName}
                userAvatar={participant.userAvatar}
                isOnline={status.isOnline}
                lastSeen={status.lastSeen}
                size={size}
                showStatus={true}
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium text-sm truncate">
                  {participant.userName}
                </span>
                {!showAvatars && (
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </div>
              
              {showLastSeen && (
                <LastSeenDisplay
                  lastSeen={status.lastSeen}
                  isOnline={status.isOnline}
                  format="smart"
                  className="text-xs"
                />
              )}
            </div>
          </div>
        )
      })}
      
      {hiddenCount > 0 && (
        <div className="flex items-center space-x-2 text-retro-textMuted">
          {showAvatars && (
            <div className="w-8 h-8 bg-retro-border/30 rounded-full flex items-center justify-center">
              <span className="text-xs">+{hiddenCount}</span>
            </div>
          )}
          <span className="text-sm">
            还有 {hiddenCount} 人
          </span>
        </div>
      )}
    </div>
  )
}