'use client'

import { useState } from 'react'
import { Post } from '@/types/social'
import UserAvatar from './UserAvatar'

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: () => void
  isMobile?: boolean
}

export default function PostCard({ post, currentUserId, onLike, isMobile = false }: PostCardProps) {
  const [showReplies, setShowReplies] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    await onLike()
    setIsLiking(false)
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
    ? "bg-retro-surface border border-retro-border rounded-lg overflow-hidden"
    : "bg-retro-surface border border-retro-border rounded-lg hover:border-retro-purple/50 transition-colors overflow-hidden"

  return (
    <div className={cardClasses}>
      {/* 帖子头部 */}
      <div className="p-4 pb-3">
        <div className="flex items-start space-x-3">
          <UserAvatar
            userId={post.author.id}
            userName={post.author.name}
            userAvatar={post.author.avatar}
            size={isMobile ? 'sm' : 'md'}
            showStatus={false}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-white truncate">
                {post.author.name}
              </h4>
              <span className="text-xs text-retro-textMuted">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
            
            {post.title && (
              <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                {post.title}
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* 帖子内容 */}
      <div className="px-4 pb-3">
        <p className="text-retro-text whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        
        {post.imageUrl && (
          <div className="mt-3">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full max-h-96 object-cover rounded-lg border border-retro-border"
            />
          </div>
        )}
      </div>

      {/* 帖子统计 */}
      <div className="px-4 pb-3 flex items-center space-x-4 text-sm text-retro-textMuted">
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>{post.viewCount}</span>
        </span>
        
        <span className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.replyCount}</span>
        </span>
      </div>

      {/* 操作按钮 */}
      <div className="px-4 py-3 border-t border-retro-border bg-retro-bg/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                post.isLiked
                  ? 'text-retro-pink bg-retro-pink/10 hover:bg-retro-pink/20'
                  : 'text-retro-textMuted hover:text-retro-pink hover:bg-retro-pink/10'
              } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg 
                className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} 
                fill={post.isLiked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{post.likeCount}</span>
            </button>

            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-retro-textMuted hover:text-white hover:bg-retro-surface transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">
                {showReplies ? '收起' : '回复'} ({post.replyCount})
              </span>
            </button>
          </div>

          {post.author.id === currentUserId && (
            <button className="text-retro-textMuted hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 回复区域 */}
      {showReplies && post.replies && (
        <div className="border-t border-retro-border bg-retro-bg/30">
          <div className="p-4 space-y-3">
            {post.replies.slice(0, 3).map((reply) => (
              <div key={reply.id} className="flex items-start space-x-3">
                <UserAvatar
                  userId={reply.author.id}
                  userName={reply.author.name}
                  userAvatar={reply.author.avatar}
                  size="xs"
                  showStatus={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white text-sm">
                      {reply.author.name}
                    </span>
                    <span className="text-xs text-retro-textMuted">
                      {formatTimeAgo(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-retro-text text-sm mt-1">
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}
            
            {post.replyCount > 3 && (
              <button className="text-retro-purple text-sm hover:underline">
                查看更多回复 ({post.replyCount - 3} 条)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}