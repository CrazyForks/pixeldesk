'use client'

import { useState } from 'react'
import { CreatePostData } from '@/types/social'

interface CreatePostFormProps {
  onSubmit: (postData: CreatePostData) => Promise<boolean>
  onCancel: () => void
  isMobile?: boolean
}

export default function CreatePostForm({ onSubmit, onCancel, isMobile = false }: CreatePostFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('请输入内容')
      return
    }

    if (content.length > 2000) {
      setError('内容过长（最多2000字符）')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const postData: CreatePostData = {
        title: title.trim() || undefined,
        content: content.trim(),
        type: 'TEXT'
      }

      const success = await onSubmit(postData)
      
      if (success) {
        setTitle('')
        setContent('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formClasses = isMobile
    ? "p-4"
    : "p-4"

  return (
    <div className={formClasses}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 标题输入（可选） */}
        <div>
          <input
            type="text"
            placeholder="添加标题（可选）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-retro-surface border border-retro-border rounded-lg text-white placeholder-retro-textMuted focus:outline-none focus:border-retro-purple transition-colors"
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        {/* 内容输入 */}
        <div>
          <textarea
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-retro-surface border border-retro-border rounded-lg text-white placeholder-retro-textMuted focus:outline-none focus:border-retro-purple transition-colors resize-none"
            rows={isMobile ? 3 : 4}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1 text-xs text-retro-textMuted">
            <span>{content.length}/2000</span>
            {error && <span className="text-red-400">{error}</span>}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* 未来可以添加图片上传、表情等功能 */}
            <button
              type="button"
              className="p-2 text-retro-textMuted hover:text-white hover:bg-retro-surface rounded-lg transition-colors"
              title="添加图片（即将推出）"
              disabled
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button
              type="button"
              className="p-2 text-retro-textMuted hover:text-white hover:bg-retro-surface rounded-lg transition-colors"
              title="添加表情（即将推出）"
              disabled
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-retro-textMuted hover:text-white hover:bg-retro-surface rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              取消
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-gradient-to-r from-retro-purple to-retro-pink text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>发布中...</span>
                </div>
              ) : (
                '发布'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}