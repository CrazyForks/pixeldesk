'use client'

import { useState, memo, useCallback, ChangeEvent } from 'react'

const statusOptions = [
  { id: 'working', label: '工作中', emoji: '💼', color: 'from-blue-500 to-cyan-500' },
  { id: 'break', label: '休息中', emoji: '☕', color: 'from-green-500 to-emerald-500' },
  { id: 'reading', label: '阅读中', emoji: '📚', color: 'from-purple-500 to-violet-500' },
  { id: 'restroom', label: '洗手间', emoji: '🚻', color: 'from-yellow-500 to-orange-500' },
  { id: 'meeting', label: '会议中', emoji: '👥', color: 'from-red-500 to-pink-500' },
  { id: 'lunch', label: '午餐时间', emoji: '🍽️', color: 'from-orange-500 to-amber-500' }
]

interface PostStatusProps {
  onStatusUpdate: (status: any) => void
  currentStatus: any
}

const PostStatus = memo(({ onStatusUpdate, currentStatus }: PostStatusProps) => {
  const [selectedStatus, setSelectedStatus] = useState('working')
  const [customMessage, setCustomMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // 优化：避免不必要的重新渲染
  const memoizedHandleSubmit = useCallback(() => {
    const status = statusOptions.find(s => s.id === selectedStatus)
    if (!status) return
    
    const fullStatus = {
      type: selectedStatus,
      status: status.label,
      emoji: status.emoji,
      message: customMessage || `正在${status.label}`,
      timestamp: new Date().toISOString()
    }
    
    // 通知 Phaser 游戏更新状态（优先执行，避免延迟）
    if (typeof window !== 'undefined' && (window as any).updateMyStatus) {
      (window as any).updateMyStatus(fullStatus)
    }
    
    // 更新 React 组件状态（异步执行，避免阻塞UI）
    requestAnimationFrame(() => {
      onStatusUpdate(fullStatus)
    })
    
    // 平滑收起面板
    setIsExpanded(false)
    setCustomMessage('')
  }, [selectedStatus, customMessage, onStatusUpdate])

  // 优化：缓存状态选择处理函数
  const memoizedHandleStatusSelect = useCallback((statusId: string) => {
    setSelectedStatus(statusId)
  }, [])

  // 优化：缓存面板切换处理函数
  const memoizedHandleToggle = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  // 优化：缓存取消处理函数
  const memoizedHandleCancel = useCallback(() => {
    setIsExpanded(false)
  }, [])

  // 优化：缓存消息变化处理函数
  const memoizedHandleMessageChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setCustomMessage(e.target.value)
  }, [])
  
  return (
    <div className="space-y-4">
      {/* 当前状态显示 */}
      {currentStatus && (
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xl">{currentStatus.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{currentStatus.status}</div>
                <div className="text-gray-400 text-sm">{currentStatus.message}</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* 状态选择按钮 */}
      <button
        onClick={memoizedHandleToggle}
        className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center justify-center gap-2">
          <span className="text-lg">📝</span>
          <span>{isExpanded ? '取消' : '更新状态'}</span>
        </div>
      </button>

      {/* 详细状态设置 */}
      {isExpanded && (
        <div className="space-y-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          {/* 状态类型选择 */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">选择状态</label>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.map((status) => (
                <button
                  key={status.id}
                  onClick={() => memoizedHandleStatusSelect(status.id)}
                  className={`group relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                    selectedStatus === status.id
                      ? 'border-white/30 bg-gradient-to-br ' + status.color + ' text-white shadow-lg'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="text-3xl mb-2">{status.emoji}</div>
                    <div className="text-sm font-medium">{status.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 自定义消息 */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              自定义消息（可选）
            </label>
            <textarea
              value={customMessage}
              onChange={memoizedHandleMessageChange}
              placeholder="分享你正在做什么..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
              rows={3}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3">
            <button
              onClick={memoizedHandleSubmit}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              发布状态
            </button>
            <button
              onClick={memoizedHandleCancel}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
})

export default PostStatus