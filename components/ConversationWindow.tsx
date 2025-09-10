'use client'

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react'
import { ChatConversation, ChatMessage, SendMessageRequest, TypingUser } from '../types/chat'
import MessageBubble from './MessageBubble'
import UserAvatar from './UserAvatar'
import LastSeenDisplay from './LastSeenDisplay'
import { useChatWebSocket } from '../lib/hooks/useChatWebSocket'
import { useSingleUserOnlineStatus } from '../lib/hooks/useOnlineStatus'

interface ConversationWindowProps {
  conversation: ChatConversation
  currentUserId: string
  position: { x: number; y: number; zIndex: number }
  isMinimized: boolean
  isActive: boolean
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
  isMobile?: boolean
  isTablet?: boolean
}



export default function ConversationWindow({
  conversation,
  currentUserId,
  position,
  isMinimized,
  isActive,
  onClose,
  onMinimize,
  onFocus,
  isMobile = false,
  isTablet = false
}: ConversationWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [windowPosition, setWindowPosition] = useState(position)
  const [isTyping, setIsTyping] = useState(false)

  // Get the other participant for private conversations
  const otherParticipant = conversation.type === 'private' 
    ? conversation.participants.find(p => p.userId !== currentUserId)
    : null

  // Use the online status hook for the other participant
  const { status: participantOnlineStatus } = useSingleUserOnlineStatus(
    otherParticipant?.userId || null
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingCleanupRef = useRef<NodeJS.Timeout | null>(null)

  // WebSocket integration for typing indicators
  const { startTyping, stopTyping, joinRoom, leaveRoom } = useChatWebSocket({
    userId: currentUserId,
    onUserTyping: useCallback((data: { userId: string; userName: string; conversationId: string; isTyping: boolean; timestamp: string }) => {
      if (data.conversationId === conversation.id && data.userId !== currentUserId) {
        const timestamp = Date.now()
        
        if (data.isTyping) {
          // Add or update typing user
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user.userId !== data.userId)
            return [...filtered, { 
              userId: data.userId, 
              userName: data.userName, 
              timestamp 
            }]
          })
        } else {
          // Remove typing user
          setTypingUsers(prev => prev.filter(user => user.userId !== data.userId))
        }
      }
    }, [conversation.id, currentUserId])
  })

  // Update window position when prop changes
  useEffect(() => {
    setWindowPosition(position)
  }, [position])

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages()
  }, [conversation.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isMinimized])

  // Focus input when window becomes active
  useEffect(() => {
    if (isActive && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive, isMinimized])

  // Join/leave room when conversation changes
  useEffect(() => {
    if (conversation.id) {
      joinRoom(conversation.id)
      
      return () => {
        leaveRoom(conversation.id)
      }
    }
  }, [conversation.id, joinRoom, leaveRoom])

  // Cleanup typing indicators that are older than 10 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => prev.filter(user => now - user.timestamp < 10000))
    }, 1000)

    return () => clearInterval(cleanupInterval)
  }, [])

  // Cleanup typing state on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (typingCleanupRef.current) {
        clearTimeout(typingCleanupRef.current)
      }
      if (isTyping) {
        stopTyping(conversation.id)
      }
    }
  }, [])

  // Handle typing detection
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      startTyping(conversation.id)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      stopTyping(conversation.id)
    }, 3000)
  }, [isTyping, startTyping, stopTyping, conversation.id])

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    if (isTyping) {
      setIsTyping(false)
      stopTyping(conversation.id)
    }
  }, [isTyping, stopTyping, conversation.id])

  const loadMessages = async () => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    // Stop typing indicator when sending message
    handleTypingStop()

    setIsSending(true)
    
    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUserId,
      senderName: 'You', // This should come from user context
      content: newMessage.trim(),
      type: 'text',
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add optimistic message to local state
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')

    try {
      const requestBody: SendMessageRequest = {
        content: optimisticMessage.content,
        type: 'text'
      }

      const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        const sentMessage = data.message

        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage : msg
        ))
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? { ...msg, status: 'failed' } : msg
        ))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? { ...msg, status: 'failed' } : msg
      ))
    } finally {
      setIsSending(false)
    }
  }

  const handleRetryMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    // Update message status to sending
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'sending' } : msg
    ))

    try {
      const requestBody: SendMessageRequest = {
        content: message.content,
        type: message.type
      }

      const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        const sentMessage = data.message

        // Replace failed message with new message
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? sentMessage : msg
        ))
      } else {
        // Mark message as failed again
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'failed' } : msg
        ))
      }
    } catch (error) {
      console.error('Failed to retry message:', error)
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'failed' } : msg
      ))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile || isTablet) return // Disable dragging on mobile/tablet
    
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y
    })
    onFocus()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 500, e.clientY - dragOffset.y))

    setWindowPosition(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const getParticipantName = () => {
    if (conversation.type === 'group') {
      return conversation.name || '群聊'
    }
    const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId)
    return otherParticipant?.userName || '未知用户'
  }

  const getParticipantAvatar = () => {
    if (conversation.type === 'group') {
      return null
    }
    const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId)
    return otherParticipant?.userAvatar
  }

  const isParticipantOnline = () => {
    if (conversation.type === 'group') {
      return conversation.participants.some(p => p.userId !== currentUserId) // Simplified for groups
    }
    return participantOnlineStatus?.isOnline || false
  }

  // Responsive window sizing
  const getWindowClasses = () => {
    if (isMobile) {
      return {
        container: 'fixed inset-4 max-w-none',
        window: 'w-full h-full',
        header: 'px-4 py-3',
        content: 'h-[calc(100%-8rem)]',
        input: 'px-4 py-3'
      }
    } else if (isTablet) {
      return {
        container: 'fixed',
        window: 'w-96 h-[500px]',
        header: 'px-4 py-3',
        content: 'h-[400px]',
        input: 'px-4 py-3'
      }
    } else {
      return {
        container: 'fixed',
        window: 'w-96 h-[500px]',
        header: 'px-4 py-3 cursor-move',
        content: 'h-[400px]',
        input: 'px-4 py-3'
      }
    }
  }

  const windowClasses = getWindowClasses()

  return (
    <div
      ref={windowRef}
      className={windowClasses.container}
      style={{
        left: isMobile ? undefined : windowPosition.x,
        top: isMobile ? undefined : windowPosition.y,
        zIndex: windowPosition.zIndex,
        transform: isMinimized ? 'scale(0.8) translateY(20px)' : 'scale(1) translateY(0)',
        opacity: isMinimized ? 0.8 : 1
      }}
      onClick={onFocus}
    >
      <div className={`${windowClasses.window} bg-retro-bg-darker border border-retro-border rounded-lg shadow-2xl transition-all duration-300 ${
        isActive ? 'shadow-retro-purple/20' : 'shadow-black/50'
      } ${isDragging ? 'cursor-grabbing' : ''}`}>
        
        {/* Window Header */}
        <div 
          className={`${windowClasses.header} border-b border-retro-border bg-gradient-to-r from-retro-purple/10 to-retro-pink/10 rounded-t-lg flex items-center justify-between ${
            !isMobile && !isTablet ? 'cursor-move' : ''
          }`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Participant Avatar with Status */}
            <UserAvatar
              userId={otherParticipant?.userId || ''}
              userName={getParticipantName()}
              userAvatar={getParticipantAvatar()}
              isOnline={isParticipantOnline()}
              lastSeen={participantOnlineStatus?.lastSeen || null}
              size="sm"
              showStatus={true}
            />

            {/* Participant Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm truncate">
                {getParticipantName()}
              </h3>
              <LastSeenDisplay
                lastSeen={participantOnlineStatus?.lastSeen || null}
                isOnline={isParticipantOnline()}
                format="smart"
                className="text-xs"
              />
            </div>
          </div>

          {/* Window Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMinimize()
              }}
              className="w-6 h-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-full flex items-center justify-center transition-colors text-xs"
              title="最小化"
            >
              −
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full flex items-center justify-center transition-colors text-xs"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        {!isMinimized && (
          <>
            <div className={`${windowClasses.content} overflow-y-auto p-4 space-y-3`}>
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-retro-purple rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-retro-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-retro-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <p className="text-retro-textMuted text-sm">加载消息中...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-retro-border/30 rounded-full flex items-center justify-center mb-4">
                    💬
                  </div>
                  <p className="text-retro-textMuted text-sm mb-2">开始对话</p>
                  <p className="text-retro-textMuted text-xs">发送第一条消息开始聊天吧！</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.senderId === currentUserId}
                      showAvatar={message.senderId !== currentUserId}
                      showTimestamp={true}
                      onRetry={message.status === 'failed' ? () => handleRetryMessage(message.id) : undefined}
                    />
                  ))}
                  
                  {/* Typing indicators */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 text-retro-textMuted text-sm animate-fade-in">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-retro-purple rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-retro-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-retro-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span>
                        {typingUsers.length === 1 
                          ? `${typingUsers[0].userName} 正在输入...`
                          : typingUsers.length === 2
                          ? `${typingUsers[0].userName} 和 ${typingUsers[1].userName} 正在输入...`
                          : `${typingUsers[0].userName} 等 ${typingUsers.length} 人正在输入...`
                        }
                      </span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className={`${windowClasses.input} border-t border-retro-border`}>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    // Trigger typing indicator when user types
                    if (e.target.value.trim()) {
                      handleTypingStart()
                    } else {
                      handleTypingStop()
                    }
                  }}
                  onBlur={handleTypingStop}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e as any)
                    }
                  }}
                  placeholder="输入消息..."
                  disabled={isSending}
                  className="flex-1 px-3 py-2 bg-retro-border/30 border border-retro-border rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-purple focus:border-transparent text-white placeholder-retro-textMuted text-sm transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-gradient-to-r from-retro-purple to-retro-pink hover:from-retro-blue hover:to-retro-cyan text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm flex-shrink-0"
                >
                  {isSending ? (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>发送中</span>
                    </div>
                  ) : (
                    '发送'
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}