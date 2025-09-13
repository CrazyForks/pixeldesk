'use client'

import PlayerProfileTab from './PlayerProfileTab'

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
  // 使用玩家档案组件，只显示被碰撞用户的帖子（只读）
  return (
    <PlayerProfileTab
      collisionPlayer={collisionPlayer}
      isActive={isActive}
      isMobile={isMobile}
      isTablet={isTablet}
    />
  )
}