'use client'

import { useMemo, useEffect, useState } from 'react'

interface LastSeenDisplayProps {
  lastSeen: string | null
  isOnline: boolean
  format?: 'relative' | 'absolute' | 'smart'
  updateInterval?: number // in seconds
  className?: string
}

export default function LastSeenDisplay({
  lastSeen,
  isOnline,
  format = 'smart',
  updateInterval = 60, // Update every minute by default
  className = ''
}: LastSeenDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time periodically for relative timestamps
  useEffect(() => {
    if (format === 'relative' || format === 'smart') {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, updateInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [format, updateInterval])

  const formattedTime = useMemo(() => {
    if (isOnline) {
      return '在线'
    }

    if (!lastSeen) {
      return '离线'
    }

    const lastSeenDate = new Date(lastSeen)
    const now = currentTime
    const diffMs = now.getTime() - lastSeenDate.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    switch (format) {
      case 'relative':
        if (diffMinutes < 1) {
          return '刚刚在线'
        } else if (diffMinutes < 60) {
          return `${diffMinutes}分钟前`
        } else if (diffHours < 24) {
          return `${diffHours}小时前`
        } else if (diffDays < 7) {
          return `${diffDays}天前`
        } else {
          return '很久之前'
        }

      case 'absolute':
        if (diffDays < 1) {
          return lastSeenDate.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        } else if (diffDays < 7) {
          return lastSeenDate.toLocaleDateString('zh-CN', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })
        } else {
          return lastSeenDate.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }

      case 'smart':
      default:
        if (diffMinutes < 1) {
          return '刚刚在线'
        } else if (diffMinutes < 60) {
          return `${diffMinutes}分钟前在线`
        } else if (diffHours < 24) {
          return `${diffHours}小时前在线`
        } else if (diffDays < 7) {
          return `${diffDays}天前在线`
        } else {
          return lastSeenDate.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
          }) + '在线'
        }
    }
  }, [lastSeen, isOnline, currentTime, format])

  const getStatusColor = () => {
    if (isOnline) {
      return 'text-green-400'
    }

    if (!lastSeen) {
      return 'text-gray-400'
    }

    const lastSeenDate = new Date(lastSeen)
    const now = currentTime
    const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) {
      return 'text-yellow-400' // Recently online
    } else if (diffHours < 24) {
      return 'text-orange-400' // Today
    } else {
      return 'text-gray-400' // Long time ago
    }
  }

  return (
    <span 
      className={`${getStatusColor()} ${className}`}
      title={lastSeen ? `最后在线: ${new Date(lastSeen).toLocaleString('zh-CN')}` : '离线'}
    >
      {formattedTime}
    </span>
  )
}