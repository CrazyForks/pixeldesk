'use client'

import PlayerInteractionPanel from '@/components/PlayerInteractionPanel'

interface PlayerInteractionTabProps {
  collisionPlayer?: any
  isActive?: boolean
  isMobile?: boolean
  isTablet?: boolean
}

export default function PlayerInteractionTab({ 
  collisionPlayer,
  isActive = false,
  isMobile = false,
  isTablet = false
}: PlayerInteractionTabProps) {
  if (!collisionPlayer) {
    // Responsive empty state layout
    const emptyStateClasses = isMobile 
      ? "h-full flex flex-col items-center justify-center p-4 text-center relative"
      : "h-full flex flex-col items-center justify-center p-6 text-center relative"
    
    const iconSize = isMobile ? "w-12 h-12" : "w-16 h-16"
    const iconInnerSize = isMobile ? "w-6 h-6" : "w-8 h-8"
    const titleSize = isMobile ? "text-sm" : "text-base"
    const textSize = isMobile ? "text-xs" : "text-sm"
    const hintPadding = isMobile ? "p-2" : "p-3"
    
    return (
      <div className={emptyStateClasses}>
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-retro-purple/5 to-retro-pink/5 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className={`${iconSize} bg-gradient-to-r from-retro-purple/20 to-retro-pink/20 rounded-full flex items-center justify-center mb-4 animate-pulse-glow`}>
            <svg className={`${iconInnerSize} text-retro-purple animate-bounce`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          
          <h3 className={`text-white font-medium mb-2 animate-pulse ${titleSize}`}>等待玩家交互</h3>
          <p className={`text-retro-textMuted leading-relaxed mb-4 ${textSize}`}>
            {isMobile ? "靠近其他玩家开始交互" : "靠近其他玩家时\n这里将显示交互选项"}
          </p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-retro-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-retro-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-retro-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Hint text - Responsive */}
          {!isMobile && (
            <div className={`mt-6 ${hintPadding} bg-retro-border/20 rounded-lg border border-retro-border/30`}>
              <p className={`text-retro-textMuted ${textSize}`}>
                💡 提示：在游戏中移动角色靠近其他玩家即可开始交互
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Transform collisionPlayer data to match PlayerData interface
  const playerData = {
    id: collisionPlayer.id || 'unknown',
    name: collisionPlayer.name || '未知玩家',
    avatar: collisionPlayer.avatar,
    currentStatus: collisionPlayer.currentStatus || {
      type: 'online',
      status: '在线',
      emoji: '🟢',
      message: collisionPlayer.name ? `${collisionPlayer.name} 正在线上` : '用户在线',
      timestamp: new Date().toISOString()
    },
    isOnline: collisionPlayer.isOnline !== false, // Default to true if not specified
    lastSeen: collisionPlayer.lastSeen || new Date().toISOString()
  }

  console.log('🎯 [PlayerInteractionTab] 显示碰撞玩家信息:', {
    原始数据: collisionPlayer,
    处理后数据: playerData
  })

  const handleSendMessage = async (message: string) => {
    // TODO: Implement actual message sending logic
    console.log('Sending message to', playerData.name, ':', message)
    // This would typically make an API call to send the message
  }

  const handleFollow = (playerId: string) => {
    // TODO: Implement follow functionality
    console.log('Following player:', playerId)
    // This would typically make an API call to follow the player
  }

  const handleViewProfile = (playerId: string) => {
    // TODO: Implement profile viewing
    console.log('Viewing profile of player:', playerId)
    // This would typically navigate to the player's profile or open a modal
  }

  return (
    <PlayerInteractionPanel
      player={playerData}
      onSendMessage={handleSendMessage}
      onFollow={handleFollow}
      onViewProfile={handleViewProfile}
      className="h-full"
      isMobile={isMobile}
      isTablet={isTablet}
    />
  )
}