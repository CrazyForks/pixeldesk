'use client'

import { useState, useCallback, memo } from 'react'

interface PlayerClickModalProps {
  isVisible: boolean
  player: any
  onClose: () => void
}

const PlayerClickModal = memo(({ 
  isVisible, 
  player, 
  onClose 
}: PlayerClickModalProps) => {
  const [activeTab, setActiveTab] = useState<'status' | 'interaction' | 'info'>('status')

  // 处理关闭
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // 如果弹窗不可见或没有玩家数据，返回null
  if (!isVisible || !player) {
    return null
  }

  // 获取状态徽章样式
  const getStatusBadge = (type: string) => {
    const badges: Record<string, string> = {
      working: 'from-blue-500 to-cyan-500',
      break: 'from-green-500 to-emerald-500',
      reading: 'from-purple-500 to-violet-500',
      restroom: 'from-yellow-500 to-orange-500',
      meeting: 'from-red-500 to-pink-500',
      lunch: 'from-orange-500 to-amber-500'
    }
    return badges[type] || 'from-gray-500 to-slate-500'
  }

  // 获取状态图标
  const getStatusIcon = (type: string) => {
    const icons: Record<string, string> = {
      working: '💼',
      break: '☕',
      reading: '📚',
      restroom: '🚻',
      meeting: '👥',
      lunch: '🍽️'
    }
    return icons[type] || '👤'
  }

  // 模拟玩家历史状态
  const playerHistory = [
    {
      id: 1,
      type: 'working',
      status: '工作中',
      emoji: '💼',
      message: '正在处理一个重要的项目',
      timestamp: '2分钟前'
    },
    {
      id: 2,
      type: 'break',
      status: '休息时间',
      emoji: '☕',
      message: '刚喝完咖啡，准备继续加油',
      timestamp: '15分钟前'
    },
    {
      id: 3,
      type: 'reading',
      status: '正在看书',
      emoji: '📚',
      message: '在读《深度工作》，很有启发',
      timestamp: '1小时前'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 半透明背景 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 弹窗容器 */}
      <div className="relative bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 玩家信息头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {player.name?.charAt(0) || 'P'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{player.name || '未知玩家'}</h2>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getStatusBadge(player.currentStatus?.type || 'working')} text-white text-xs font-medium`}>
                  {player.currentStatus?.emoji} {player.currentStatus?.status || '在线'}
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
        </div>

        {/* 标签页 */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'status', label: '状态历史', icon: '📊' },
            { id: 'interaction', label: '互动', icon: '🎮' },
            { id: 'info', label: '基本信息', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div className="space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {playerHistory.map((history) => (
                <div key={history.id} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${getStatusBadge(history.type)} text-white text-xs font-medium`}>
                      {history.emoji} {history.status}
                    </div>
                    <span className="text-gray-400 text-xs">{history.timestamp}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{history.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'interaction' && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">快速互动</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { emoji: '👋', label: '打招呼', action: 'wave' },
                    { emoji: '🎉', label: '庆祝', action: 'celebrate' },
                    { emoji: '👍', label: '点赞', action: 'like' },
                    { emoji: '❤️', label: '表达喜欢', action: 'love' }
                  ].map((action) => (
                    <button
                      key={action.action}
                      className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-white text-sm transition-all duration-200 hover:scale-[1.02]"
                    >
                      <span>{action.emoji}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">发送消息</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                  />
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                    发送
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">基本信息</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">玩家ID:</span>
                    <span className="text-white font-mono text-sm">{player.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">当前状态:</span>
                    <span className="text-white">{player.currentStatus?.status || '在线'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">状态消息:</span>
                    <span className="text-white text-sm max-w-[200px] truncate">{player.currentStatus?.message || '无'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">更新时间:</span>
                    <span className="text-white text-sm">
                      {new Date(player.currentStatus?.timestamp).toLocaleTimeString() || '刚刚'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            关闭
          </button>
          <button
            onClick={() => {
              // 这里可以添加关注功能
              console.log('关注玩家:', player.name)
            }}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200"
          >
            关注
          </button>
        </div>
      </div>
    </div>
  )
})

export default PlayerClickModal