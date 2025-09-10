'use client'

import { useState } from 'react'
import UserStatusIndicator from './UserStatusIndicator'

interface UserAvatarProps {
  userId: string
  userName: string
  userAvatar?: string | null
  isOnline?: boolean
  lastSeen?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
  onClick?: () => void
}

export default function UserAvatar({
  userId,
  userName,
  userAvatar,
  isOnline = false,
  lastSeen,
  size = 'md',
  showStatus = true,
  statusPosition = 'bottom-right',
  className = '',
  onClick
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const statusSizeClasses = {
    xs: 'sm',
    sm: 'sm',
    md: 'md',
    lg: 'md',
    xl: 'lg'
  } as const

  const statusPositionClasses = {
    'bottom-right': '-bottom-0.5 -right-0.5',
    'bottom-left': '-bottom-0.5 -left-0.5',
    'top-right': '-top-0.5 -right-0.5',
    'top-left': '-top-0.5 -left-0.5'
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div 
      className={`relative flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-retro-purple to-retro-pink rounded-full flex items-center justify-center overflow-hidden`}>
        {userAvatar && !imageError ? (
          <img 
            src={userAvatar} 
            alt={userName}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <span className={`text-white font-medium ${textSizeClasses[size]}`}>
            {getInitials(userName)}
          </span>
        )}
      </div>
      
      {showStatus && (
        <div className={`absolute ${statusPositionClasses[statusPosition]}`}>
          <UserStatusIndicator
            isOnline={isOnline}
            lastSeen={lastSeen}
            size={statusSizeClasses[size]}
          />
        </div>
      )}
    </div>
  )
}