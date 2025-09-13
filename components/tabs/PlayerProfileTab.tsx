'use client'

import { useState, useEffect } from 'react'
import { useSocialPosts } from '@/lib/hooks/useSocialPosts'
import { useCurrentUserId } from '@/lib/hooks/useCurrentUser'
import PostCard from '@/components/PostCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import UserAvatar from '@/components/UserAvatar'

interface PlayerProfileTabProps {
  collisionPlayer?: any
  isActive?: boolean
  isMobile?: boolean
  isTablet?: boolean
}

export default function PlayerProfileTab({ 
  collisionPlayer,
  isActive = false,
  isMobile = false,
  isTablet = false
}: PlayerProfileTabProps) {
  const currentUserId = useCurrentUserId()
  
  // 调试信息：确认碰撞玩家信息
  useEffect(() => {
    if (collisionPlayer) {
      console.log('👥 [PlayerProfileTab] 碰撞玩家:', { 
        id: collisionPlayer.id, 
        name: collisionPlayer.name,
        isActive,
        currentUserId 
      })
    }
  }, [collisionPlayer, isActive, currentUserId])
  
  // 使用社交帖子hook，获取特定用户的帖子
  const {
    posts,
    isLoading,
    isRefreshing,
    error,
    pagination,
    refreshPosts,
    loadMorePosts,
    likePost
  } = useSocialPosts({
    userId: currentUserId || '', // 当前登录用户ID
    autoFetch: isActive && !!collisionPlayer?.id && !!currentUserId,
    refreshInterval: isActive && !!collisionPlayer?.id ? 30000 : 0, // 30秒刷新一次，仅在有碰撞且激活时
    filterByAuthor: collisionPlayer?.id // 只显示被碰撞用户的帖子
  })

  const handleLikePost = async (postId: string) => {
    if (!currentUserId) {
      console.warn('用户未登录，无法点赞')
      return
    }
    
    try {
      await likePost(postId)
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  // 处理滚动到底部加载更多
  const handleLoadMore = () => {
    if (pagination.hasNextPage && !isRefreshing) {
      loadMorePosts()
    }
  }

  // 如果没有碰撞玩家，显示等待状态
  if (!collisionPlayer) {
    const emptyStateClasses = isMobile 
      ? "h-full flex flex-col items-center justify-center p-4 text-center relative"
      : "h-full flex flex-col items-center justify-center p-6 text-center relative"
    
    const iconSize = isMobile ? "w-12 h-12" : "w-16 h-16"
    const iconInnerSize = isMobile ? "w-6 h-6" : "w-8 h-8"
    const titleSize = isMobile ? "text-sm" : "text-base"
    const textSize = isMobile ? "text-xs" : "text-sm"
    
    return (
      <div className={emptyStateClasses}>
        {/* 动画背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-retro-purple/5 to-retro-pink/5 animate-pulse"></div>
        
        <div className="relative z-10">
          <div className={`${iconSize} bg-gradient-to-r from-retro-purple/20 to-retro-pink/20 rounded-full flex items-center justify-center mb-4 animate-pulse-glow`}>
            <svg className={`${iconInnerSize} text-retro-purple animate-bounce`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h3 className={`text-white font-medium mb-2 animate-pulse ${titleSize}`}>等待玩家交互</h3>
          <p className={`text-retro-textMuted leading-relaxed mb-4 ${textSize}`}>
            {isMobile ? "靠近其他玩家查看他们的动态" : "靠近其他玩家时\n这里将显示他们发布的帖子"}
          </p>
          
          {/* 动画点 */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-retro-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-retro-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-retro-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  const containerClasses = isMobile 
    ? "h-full flex flex-col bg-retro-bg"
    : "h-full flex flex-col bg-retro-bg"

  return (
    <div className={containerClasses}>
      {/* 用户信息头部 */}
      <div className="flex-shrink-0 p-4 border-b border-retro-border">
        <div className="flex items-center space-x-3">
          <UserAvatar
            userId={collisionPlayer.id}
            userName={collisionPlayer.name}
            userAvatar={collisionPlayer.avatar}
            size={isMobile ? 'md' : 'lg'}
            showStatus={true}
            isOnline={collisionPlayer.isOnline}
            lastSeen={collisionPlayer.lastSeen}
          />
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{collisionPlayer.name}</h3>
            <p className="text-sm text-retro-textMuted">
              {collisionPlayer.currentStatus?.message || '查看这位用户的动态'}
            </p>
          </div>
          
          <button
            onClick={refreshPosts}
            disabled={isRefreshing}
            className="p-2 text-retro-textMuted hover:text-white hover:bg-retro-surface rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 帖子内容区域 */}
      <div className="flex-1 overflow-hidden">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 m-4 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-retro-purple/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-retro-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m0 0V6a2 2 0 012-2h8a2 2 0 012 2v2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">暂无动态</h3>
            <p className="text-retro-textMuted text-sm">
              {collisionPlayer.name} 还没有发布任何帖子
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="space-y-4 p-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId || ''}
                  onLike={() => handleLikePost(post.id)}
                  isMobile={isMobile}
                />
              ))}
              
              {/* 加载更多按钮 */}
              {pagination.hasNextPage && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-retro-surface text-white rounded-lg hover:bg-retro-surface/80 transition-colors disabled:opacity-50"
                  >
                    {isRefreshing ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}