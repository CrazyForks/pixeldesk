'use client'

import { useState } from 'react'
import { CreateReplyData } from '@/types/social'

interface CreateReplyFormProps {
  onSubmit: (replyData: CreateReplyData) => Promise<boolean>
  onCancel: () => void
  isMobile?: boolean
  isSubmitting?: boolean
}

export default function CreateReplyForm({ 
  onSubmit, 
  onCancel, 
  isMobile = false,
  isSubmitting = false
}: CreateReplyFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isInternalSubmitting, setIsInternalSubmitting] = useState(false)

  // 简单的键盘输入控制
  const handleInputFocus = () => {
    if (typeof window !== 'undefined' && (window as any).disableGameKeyboard) {
      (window as any).disableGameKeyboard()
    }
  }

  const handleInputBlur = () => {
    if (typeof window !== 'undefined' && (window as any).enableGameKeyboard) {
      (window as any).enableGameKeyboard()
    }
  }

  const finalIsSubmitting = isSubmitting || isInternalSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🚀 [CreateReplyForm] 开始提交回复，内容:', content.trim())

    if (!content.trim()) {
      setError('请输入回复内容')
      return
    }

    if (content.length > 1000) {
      setError('回复过长（最多1000字符）')
      return
    }

    setIsInternalSubmitting(true)
    setError('')

    try {
      const replyData: CreateReplyData = {
        content: content.trim()
      }

      console.log('📤 [CreateReplyForm] 调用onSubmit，数据:', replyData)
      const success = await onSubmit(replyData)
      console.log('📥 [CreateReplyForm] onSubmit结果:', success)

      if (success) {
        setContent('')
        console.log('✅ [CreateReplyForm] 回复成功，表单已清空')
      } else {
        setError('回复失败，请重试')
        console.error('❌ [CreateReplyForm] 回复失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '回复失败'
      setError(errorMessage)
      console.error('❌ [CreateReplyForm] 回复异常:', err)
    } finally {
      setIsInternalSubmitting(false)
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border border-retro-border/50 rounded-lg p-3 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 内容输入 - 紧凑文本区域 */}
        <div className="relative group">
          <textarea
            placeholder="Write a reply..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="relative w-full bg-gradient-to-br from-retro-bg-dark/80 to-retro-bg-darker/80 border border-retro-border focus:border-retro-blue rounded-lg px-3 py-2 text-white placeholder-retro-textMuted focus:outline-none backdrop-blur-md transition-all duration-300 font-retro text-sm resize-none focus:shadow-lg focus:shadow-retro-blue/20"
            rows={isMobile ? 2 : 3}
            maxLength={1000}
            disabled={finalIsSubmitting}
            data-input-container="true"
          />

          {/* 字符计数和错误显示 */}
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-xs text-retro-textMuted font-pixel">{content.length}/1000</span>
            {error && (
              <span className="text-retro-red text-xs font-pixel">{error}</span>
            )}
          </div>
        </div>

        {/* 操作按钮 - 紧凑设计 */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setContent('')
              setError('')
            }}
            disabled={finalIsSubmitting}
            className="relative group overflow-hidden bg-gradient-to-r from-retro-bg-dark/80 to-retro-bg-darker/80 hover:from-retro-border/60 hover:to-retro-border/80 text-white font-medium py-1.5 px-3 rounded-lg border border-retro-border hover:border-retro-yellow/60 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-1">
              <span className="text-xs">🧹</span>
              <span className="font-pixel text-xs">CLEAR</span>
            </div>
          </button>

          <button
            type="submit"
            disabled={finalIsSubmitting || !content.trim()}
            className="relative group overflow-hidden bg-gradient-to-r from-retro-blue to-retro-cyan hover:from-retro-cyan hover:to-retro-green text-white font-bold py-1.5 px-4 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-200 shadow-sm hover:shadow-lg backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-1">
              {finalIsSubmitting ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-pixel text-xs">REPLY...</span>
                </>
              ) : (
                <>
                  <span className="text-xs">💬</span>
                  <span className="font-pixel text-xs">REPLY</span>
                </>
              )}
            </div>
          </button>
        </div>
      </form>
    </div>
  )
}