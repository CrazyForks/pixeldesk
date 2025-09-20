'use client'

import { useState } from 'react'
import { Post, CreateReplyData } from '@/types/social'
import UserAvatar from './UserAvatar'
import CreateReplyForm from './CreateReplyForm'
import { usePostReplies } from '@/lib/hooks/usePostReplies'

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: () => void
  onReplyCountUpdate?: (postId: string, newCount: number) => void
  isMobile?: boolean
}

export default function PostCard({ post, currentUserId, onLike, onReplyCountUpdate, isMobile = false }: PostCardProps) {
  const [showReplies, setShowReplies] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  // 使用回复hook来管理回复数据
  const {
    replies,
    isLoading: isLoadingReplies,
    isCreatingReply,
    error: repliesError,
    pagination: repliesPagination,
    fetchReplies,
    createReply,
    loadMoreReplies,
    refreshReplies
  } = usePostReplies({
    postId: post.id,
    userId: currentUserId,
    autoFetch: showReplies // 只有在显示回复时才自动获取
  })

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    await onLike()
    setIsLiking(false)
  }

  // 处理回复提交
  const handleReplySubmit = async (replyData: CreateReplyData) => {
    console.log('🎯 [PostCard] 开始处理回复提交，postId:', post.id, '回复数据:', replyData)
    console.log('🔍 [PostCard] 当前用户ID:', currentUserId)

    const newReply = await createReply(replyData)
    console.log('📦 [PostCard] createReply返回结果:', newReply)

    if (newReply) {
      // 更新帖子的回复计数
      if (onReplyCountUpdate) {
        console.log('📊 [PostCard] 更新回复计数，从', post.replyCount, '到', (post.replyCount || 0) + 1)
        onReplyCountUpdate(post.id, (post.replyCount || 0) + 1)
      }
      console.log('✅ [PostCard] 回复创建成功:', newReply)
    } else {
      console.error('❌ [PostCard] 回复创建失败')
    }
    return !!newReply
  }

  // 处理显示/隐藏回复
  const handleToggleReplies = () => {
    const newShowReplies = !showReplies
    setShowReplies(newShowReplies)
    
    // 如果要显示回复且还没有数据，则获取数据
    if (newShowReplies && replies.length === 0) {
      fetchReplies()
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return '刚刚'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  const cardClasses = isMobile
    ? "group relative bg-retro-bg-dark/98 rounded-2xl overflow-hidden shadow-lg border border-retro-border/10 transition-all duration-300"
    : "group relative bg-retro-bg-dark/98 rounded-2xl overflow-hidden shadow-lg border border-retro-border/10 hover:shadow-xl hover:shadow-retro-purple/10 hover:border-retro-border/20 transition-all duration-300"

  return (
    <div className={cardClasses}>
      {/* 帖子头部 - 优化层次结构 */}
      <div className="p-5">
        <div className="flex items-start space-x-4">
          {/* 头像区域 */}
          <div className="flex-shrink-0">
            <UserAvatar
              userId={post.author.id}
              userName={post.author.name}
              userAvatar={post.author.avatar}
              size={isMobile ? 'md' : 'lg'}
              showStatus={true}
              isOnline={post.author.isOnline}
              lastSeen={post.author.lastSeen}
            />
          </div>
          
          {/* 作者信息和时间 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-white text-base truncate">
                {post.author.name}
              </h4>
              <span className="text-retro-textMuted">•</span>
              <span className="text-sm text-retro-textMuted">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
            
            {/* 帖子标题 */}
            {post.title && (
              <h3 className="text-lg font-bold text-white mt-2 leading-tight">
                {post.title}
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* 帖子内容 - 优化间距 */}
      <div className="px-5 pb-5">
        {/* 内容文本 */}
        <p className="text-retro-text whitespace-pre-wrap leading-relaxed text-base mb-4">
          {post.content}
        </p>
        
        {/* 图片内容 */}
        {post.imageUrl && (
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full max-h-80 object-cover"
            />
          </div>
        )}
      </div>

      {/* 统计和操作区域 - 三按钮设计 */}
      <div className="px-5 py-4 border-t border-retro-border/15 bg-gradient-to-b from-transparent to-retro-bg-darker/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 浏览数 */}
            <div className="flex items-center space-x-2 text-retro-textMuted/80">
              <div className="w-5 h-5 bg-retro-cyan/20 rounded flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium">{post.viewCount}</span>
            </div>

            {/* 回复数 - 可点击 */}
            <button
              onClick={handleToggleReplies}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-retro-textMuted hover:text-retro-blue hover:bg-retro-blue/10 border border-retro-border/30 hover:border-retro-blue/30 transition-all duration-300 font-medium shadow-sm hover:scale-105 active:scale-95 hover:shadow-md"
            >
              <div className="w-5 h-5 bg-retro-blue/20 rounded flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-sm">{post.replyCount}</span>
            </button>

            {/* 点赞按钮 */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium shadow-sm ${
                post.isLiked
                  ? 'text-retro-pink bg-retro-pink/15 border border-retro-pink/40 shadow-retro-pink/20'
                  : 'text-retro-textMuted hover:text-retro-pink hover:bg-retro-pink/10 border border-retro-border/30 hover:border-retro-pink/30 hover:shadow-md'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
            >
              <div className={`w-5 h-5 ${post.isLiked ? 'bg-retro-pink/30' : 'bg-retro-textMuted/20'} rounded flex items-center justify-center transition-all duration-200`}>
                <svg 
                  className={`w-3 h-3 ${post.isLiked ? 'fill-current text-retro-pink' : ''} transition-all duration-200`} 
                  fill={post.isLiked ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-sm">{post.likeCount}</span>
            </button>
          </div>

          {/* 删除按钮（仅作者可见） */}
          {post.author.id === currentUserId && (
            <button className="p-2.5 text-retro-textMuted hover:text-retro-red rounded-xl hover:bg-retro-red/10 border border-retro-border/30 hover:border-retro-red/30 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 hover:shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 回复区域 - 优化层次和间距 */}
      {showReplies && (
        <div className="border-t border-retro-border/20">
          <div className="p-5 space-y-4 bg-retro-bg-darker/20">
            {/* 回复输入表单 - 直接显示在顶部 */}
            <CreateReplyForm
              onSubmit={handleReplySubmit}
              onCancel={() => {}} // 不需要取消功能，因为表单始终显示
              isMobile={isMobile}
              isSubmitting={isCreatingReply}
            />

            {/* 错误显示 */}
            {repliesError && (
              <div className="p-3 bg-retro-red/10 border border-retro-red/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-retro-red/20 rounded flex items-center justify-center">
                    <span className="text-xs">⚠️</span>
                  </div>
                  <span className="text-retro-red text-sm font-pixel">{repliesError}</span>
                </div>
              </div>
            )}

            {/* 回复列表标题 */}
            <div className="flex items-center gap-2 pt-2">
              <svg className="w-4 h-4 text-retro-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 className="text-base font-semibold text-white">
                Replies ({post.replyCount || 0})
              </h4>
            </div>
            
            {/* 加载状态 */}
            {isLoadingReplies && replies.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-retro-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-retro-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-retro-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            {/* 回复列表 */}
            {replies.length > 0 && (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="bg-retro-bg-darker/40 rounded-xl p-4 border border-retro-border/15">
                    <div className="flex items-start space-x-4">
                      {/* 回复者头像 */}
                      <div className="flex-shrink-0 pt-0.5">
                        <UserAvatar
                          userId={reply.author.id}
                          userName={reply.author.name}
                          userAvatar={reply.author.avatar}
                          size="sm"
                          showStatus={true}
                          isOnline={reply.author.isOnline}
                          lastSeen={reply.author.lastSeen}
                        />
                      </div>
                      
                      {/* 回复内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-white text-sm">
                            {reply.author.name}
                          </span>
                          <span className="text-retro-textMuted">•</span>
                          <span className="text-xs text-retro-textMuted">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-retro-text text-sm leading-relaxed">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 没有回复时的空状态 */}
            {!isLoadingReplies && replies.length === 0 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-retro-blue/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-retro-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-retro-textMuted">No replies yet</p>
                <p className="text-xs text-retro-textMuted/70 mt-1">Be the first to reply!</p>
              </div>
            )}
            
            {/* 加载更多回复按钮 */}
            {repliesPagination.hasNextPage && (
              <div className="flex justify-center pt-2">
                <button 
                  onClick={loadMoreReplies}
                  disabled={isLoadingReplies}
                  className="px-4 py-2 bg-retro-purple/10 hover:bg-retro-purple/20 text-retro-purple rounded-lg border border-retro-purple/30 hover:border-retro-purple/50 transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  {isLoadingReplies ? 'Loading...' : `Load More (${repliesPagination.totalPages - repliesPagination.page})`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}