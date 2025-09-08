'use client'

import PlayerInteractionPanel from '@/components/PlayerInteractionPanel'

interface PlayerInteractionTabProps {
  collisionPlayer?: any
  isActive?: boolean
}

export default function PlayerInteractionTab({ 
  collisionPlayer,
  isActive = false
}: PlayerInteractionTabProps) {
  if (!collisionPlayer) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-retro-purple/20 to-retro-pink/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-retro-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-2">等待玩家交互</h3>
        <p className="text-retro-textMuted text-sm leading-relaxed">
          靠近其他玩家时<br />
          这里将显示交互选项
        </p>
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
    />
  )
}