'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'

interface PlayerData {
  id: string
  name: string
  avatar?: string
  currentStatus?: StatusData
  isOnline: boolean
  lastSeen?: string
}

interface StatusData {
  type: string
  status: string
  emoji?: string
  message?: string
  timestamp: string
}

interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  type: 'text' | 'emoji' | 'system'
}

interface PlayerInteractionPanelProps {
  player: PlayerData
  onSendMessage?: (message: string) => void
  onFollow?: (playerId: string) => void
  onViewProfile?: (playerId: string) => void
  className?: string
}

export default function PlayerInteractionPanel({
  player,
  onSendMessage,
  onFollow,
  onViewProfile,
  className = ''
}: PlayerInteractionPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock chat messages for demonstration
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        senderId: player.id,
        receiverId: 'current-user',
        content: '你好！很高兴遇到你',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'text'
      },
      {
        id: '2',
        senderId: 'current-user',
        receiverId: player.id,
        content: '你好！我也很高兴认识你',
        timestamp: new Date(Date.now() - 240000).toISOString(),
        type: 'text'
      }
    ]
    setChatMessages(mockMessages)
  }, [player.id])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'current-user',
      receiverId: player.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    // Add message to local state
    setChatMessages(prev => [...prev, message])
    setNewMessage('')

    // Call external handler if provided
    if (onSendMessage) {
      try {
        await onSendMessage(message.content)
      } catch (error) {
        console.error('Failed to send message:', error)
        // Could add error handling UI here
      }
    }

    setIsLoading(false)
  }

  const handleFollow = () => {
    if (onFollow) {
      onFollow(player.id)
    }
  }

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(player.id)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小时前`
    return date.toLocaleDateString()
  }

  const getStatusBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      working: 'from-blue-500 to-cyan-500',
      break: 'from-green-500 to-emerald-500',
      meeting: 'from-red-500 to-pink-500',
      lunch: 'from-orange-500 to-yellow-500',
      restroom: 'from-purple-500 to-indigo-500',
      reading: 'from-violet-500 to-purple-500'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className={`h-full flex flex-col bg-retro-bg-darker ${className}`}>
      {/* Player Info Header */}
      <div className="p-6 border-b border-retro-border bg-gradient-to-r from-retro-purple/10 to-retro-pink/10">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-retro-purple to-retro-pink rounded-full flex items-center justify-center shadow-lg">
              {player.avatar ? (
                <img 
                  src={player.avatar} 
                  alt={player.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {player.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            {/* Online Status Indicator */}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-retro-bg-darker ${
              player.isOnline ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
          </div>

          {/* Player Details */}
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg mb-1">
              {player.name || '未知玩家'}
            </h3>
            
            {/* Status Badge */}
            {player.currentStatus && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${getStatusBadgeColor(player.currentStatus.type)} text-white text-sm font-medium mb-2`}>
                {player.currentStatus.emoji && (
                  <span className="mr-1">{player.currentStatus.emoji}</span>
                )}
                {player.currentStatus.status}
              </div>
            )}
            
            {/* Online Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                player.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-retro-textMuted text-sm">
                {player.isOnline ? '在线' : `最后在线: ${player.lastSeen || '未知'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {player.currentStatus?.message && (
          <div className="mt-4 p-3 bg-retro-border/30 rounded-lg">
            <p className="text-retro-text text-sm leading-relaxed">
              {player.currentStatus.message}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-retro-border">
        <h4 className="text-white font-medium mb-3 text-sm">快速操作</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleFollow}
            className="bg-retro-purple/20 hover:bg-retro-purple/30 text-white py-2 px-3 rounded-lg transition-all duration-200 text-xs font-medium hover:scale-105 active:scale-95"
          >
            <span className="block">👥</span>
            <span>关注</span>
          </button>
          <button
            onClick={handleViewProfile}
            className="bg-retro-pink/20 hover:bg-retro-pink/30 text-white py-2 px-3 rounded-lg transition-all duration-200 text-xs font-medium hover:scale-105 active:scale-95"
          >
            <span className="block">👁️</span>
            <span>详情</span>
          </button>
          <button className="bg-blue-500/20 hover:bg-blue-500/30 text-white py-2 px-3 rounded-lg transition-all duration-200 text-xs font-medium hover:scale-105 active:scale-95">
            <span className="block">🎮</span>
            <span>邀请</span>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-retro-border">
          <h4 className="text-white font-medium text-sm flex items-center">
            💬 快速聊天
            <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </h4>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="text-center text-retro-textMuted py-8">
              <div className="w-12 h-12 bg-retro-border/30 rounded-full flex items-center justify-center mx-auto mb-3">
                💬
              </div>
              <p className="text-sm">还没有聊天记录</p>
              <p className="text-xs mt-1">发送第一条消息开始对话吧！</p>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.senderId === 'current-user'
                      ? 'bg-gradient-to-r from-retro-purple to-retro-pink text-white'
                      : 'bg-retro-border/30 text-retro-text'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === 'current-user' 
                      ? 'text-white/70' 
                      : 'text-retro-textMuted'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-retro-border">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入消息..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-retro-border/30 border border-retro-border rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-purple focus:border-transparent text-white placeholder-retro-textMuted text-sm transition-all duration-200 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="bg-gradient-to-r from-retro-purple to-retro-pink hover:from-retro-blue hover:to-retro-cyan text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}