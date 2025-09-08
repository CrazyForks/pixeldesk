'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import for SocialFeed to avoid SSR issues
const SocialFeed = dynamic(() => import('@/components/SocialFeed'), {
  ssr: false
})

interface StatusInfoTabProps {
  children?: ReactNode
  currentUser?: any
  workstationStats?: any
  onTeleportClick?: () => void
  isActive?: boolean
}

export default function StatusInfoTab({ 
  children, 
  currentUser, 
  workstationStats, 
  onTeleportClick,
  isActive = false
}: StatusInfoTabProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Personal status area */}
      <div className="p-6 border-b border-retro-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">我的状态</h2>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        {children}
      </div>
      
      {/* Workstation stats area */}
      <div className="p-6 border-b border-retro-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">工位统计</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className="text-xs text-retro-textMuted">实时</span>
          </div>
        </div>
        {workstationStats ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">工位总数</span>
              <span className="text-white font-medium">{workstationStats.totalWorkstations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">已绑定</span>
              <span className="text-green-400 font-medium">{workstationStats.boundWorkstations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">可用</span>
              <span className="text-blue-400 font-medium">{workstationStats.availableWorkstations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">占用率</span>
              <span className="text-purple-400 font-medium">{workstationStats.occupancyRate}</span>
            </div>
            
            {/* Quick teleport button */}
            {currentUser?.workstationId && (
              <div className="pt-4 border-t border-retro-border mt-4">
                <button
                  onClick={onTeleportClick}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  🚀 快速回到工位
                  <span className="text-xs ml-2 opacity-80">(消耗1积分)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-retro-textMuted text-sm">加载中...</span>
          </div>
        )}
      </div>
      
      {/* Social feed area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-retro-border">
          <h2 className="text-lg font-semibold text-white">社交动态</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-retro-textMuted">实时</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-retro-purple/20 to-retro-pink/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-retro-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">探索社交空间</h3>
            <p className="text-retro-textMuted text-sm leading-relaxed">
              在游戏中靠近其他玩家<br />
              查看他们的动态信息并进行互动
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}