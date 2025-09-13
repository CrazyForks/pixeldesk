'use client'

import { ReactNode, useState } from 'react'
import dynamic from 'next/dynamic'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import { useSocialPosts } from '@/lib/hooks/useSocialPosts'
import CreatePostForm from '@/components/CreatePostForm'
import { CreatePostData } from '@/types/social'

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
  isMobile?: boolean
  isTablet?: boolean
}

export default function StatusInfoTab({ 
  children, 
  currentUser, 
  workstationStats, 
  onTeleportClick,
  isActive = false,
  isMobile = false,
  isTablet = false
}: StatusInfoTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // 获取当前用户信息
  const { currentUser: loggedInUser, userId } = useCurrentUser()
  
  // 使用社交帖子hook进行发帖
  const { createPost } = useSocialPosts({
    userId: userId || '',
    autoFetch: false // 这里不需要自动获取帖子
  })

  // Responsive layout classes
  const containerPadding = isMobile ? "p-4" : "p-6"
  const titleSize = isMobile ? "text-base" : "text-lg"
  const textSize = isMobile ? "text-xs" : "text-sm"
  const spacing = isMobile ? "space-y-2" : "space-y-3"
  const buttonPadding = isMobile ? "py-2 px-3" : "py-2 px-4"

  // 处理创建帖子
  const handleCreatePost = async (postData: CreatePostData) => {
    if (!userId) {
      console.error('用户ID未获取到，无法发帖')
      return false
    }
    
    const newPost = await createPost(postData)
    if (newPost) {
      setShowCreateForm(false)
      console.log('✅ [StatusInfoTab] 帖子发布成功:', newPost)
    }
    return !!newPost
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content container */}
      <div className="flex-1 overflow-y-auto">
        {/* Personal status area */}
        <div className={`${containerPadding} border-b border-retro-border`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${titleSize} font-semibold text-white`}>我的状态</h2>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        {children}
        
        {/* 个人发帖功能 */}
        <div className={`${isMobile ? 'pt-3 mt-3' : 'pt-4 mt-4'} border-t border-retro-border`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-white`}>分享动态</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`${buttonPadding} bg-gradient-to-r from-retro-purple to-retro-pink text-white text-sm rounded-lg hover:shadow-lg transition-all duration-200`}
            >
              {showCreateForm ? '取消' : '发帖'}
            </button>
          </div>
          
          {showCreateForm && (
            <div className="mt-4">
              <CreatePostForm
                onSubmit={handleCreatePost}
                onCancel={() => setShowCreateForm(false)}
                isMobile={isMobile}
              />
            </div>
          )}
        </div>
      </div>
        
        {/* Workstation stats area */}
        <div className={`${containerPadding} border-b border-retro-border`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${titleSize} font-semibold text-white`}>工位统计</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span className={`text-xs text-retro-textMuted ${isMobile ? 'hidden' : 'inline'}`}>实时</span>
          </div>
        </div>
        {workstationStats ? (
          <div className={spacing}>
            <div className="flex justify-between items-center">
              <span className={`text-gray-300 ${textSize}`}>工位总数</span>
              <span className={`text-white font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>{workstationStats.totalWorkstations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-gray-300 ${textSize}`}>已绑定</span>
              <span className={`text-green-400 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>{workstationStats.boundWorkstations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-gray-300 ${textSize}`}>可用</span>
              <span className={`text-blue-400 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>{workstationStats.availableWorkstations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-gray-300 ${textSize}`}>占用率</span>
              <span className={`text-purple-400 font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>{workstationStats.occupancyRate}</span>
            </div>
            
            {/* Quick teleport button */}
            {currentUser?.workstationId && (
              <div className={`${isMobile ? 'pt-3 mt-3' : 'pt-4 mt-4'} border-t border-retro-border`}>
                <button
                  onClick={onTeleportClick}
                  className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium ${buttonPadding} rounded-lg transition-all duration-200 transform hover:scale-105 ${isMobile ? 'text-sm' : 'text-base'}`}
                >
                  🚀 {isMobile ? '回到工位' : '快速回到工位'}
                  {!isMobile && <span className="text-xs ml-2 opacity-80">(消耗1积分)</span>}
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
      </div>
    </div>
  )
}