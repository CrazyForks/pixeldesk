'use client'

import { useState } from 'react'
import UserStatusIndicator from './UserStatusIndicator'
import UserAvatar from './UserAvatar'
import LastSeenDisplay from './LastSeenDisplay'
import ConversationParticipantStatus from './ConversationParticipantStatus'
import { ConversationParticipant } from '../types/chat'

export default function UserStatusDemo() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSeen, setLastSeen] = useState<string | null>(new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes ago

  const mockParticipants: ConversationParticipant[] = [
    {
      id: '1',
      userId: 'user1',
      userName: '张三',
      userAvatar: undefined,
      joinedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: '2',
      userId: 'user2',
      userName: '李四',
      userAvatar: undefined,
      joinedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: '3',
      userId: 'user3',
      userName: '王五',
      userAvatar: undefined,
      joinedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      isActive: true
    }
  ]

  return (
    <div className="p-6 bg-retro-bg-darker rounded-lg space-y-6">
      <h2 className="text-white text-xl font-bold mb-4">用户状态显示组件演示</h2>
      
      {/* Controls */}
      <div className="flex items-center space-x-4 p-4 bg-retro-border/20 rounded-lg">
        <button
          onClick={() => setIsOnline(!isOnline)}
          className="bg-retro-purple hover:bg-retro-pink text-white px-4 py-2 rounded-lg transition-colors"
        >
          切换在线状态: {isOnline ? '在线' : '离线'}
        </button>
        <button
          onClick={() => setLastSeen(isOnline ? null : new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString())}
          className="bg-retro-blue hover:bg-retro-cyan text-white px-4 py-2 rounded-lg transition-colors"
        >
          随机最后在线时间
        </button>
      </div>

      {/* Status Indicator Demo */}
      <div className="space-y-4">
        <h3 className="text-white text-lg font-semibold">状态指示器</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-retro-textMuted">小:</span>
            <UserStatusIndicator isOnline={isOnline} lastSeen={lastSeen} size="sm" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-retro-textMuted">中:</span>
            <UserStatusIndicator isOnline={isOnline} lastSeen={lastSeen} size="md" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-retro-textMuted">大:</span>
            <UserStatusIndicator isOnline={isOnline} lastSeen={lastSeen} size="lg" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-retro-textMuted">带文字:</span>
            <UserStatusIndicator isOnline={isOnline} lastSeen={lastSeen} size="md" showText={true} />
          </div>
        </div>
      </div>

      {/* User Avatar Demo */}
      <div className="space-y-4">
        <h3 className="text-white text-lg font-semibold">用户头像</h3>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center space-y-2">
            <UserAvatar
              userId="demo1"
              userName="张三"
              isOnline={isOnline}
              lastSeen={lastSeen}
              size="xs"
            />
            <span className="text-xs text-retro-textMuted">XS</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <UserAvatar
              userId="demo2"
              userName="李四"
              isOnline={isOnline}
              lastSeen={lastSeen}
              size="sm"
            />
            <span className="text-xs text-retro-textMuted">SM</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <UserAvatar
              userId="demo3"
              userName="王五"
              isOnline={isOnline}
              lastSeen={lastSeen}
              size="md"
            />
            <span className="text-xs text-retro-textMuted">MD</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <UserAvatar
              userId="demo4"
              userName="赵六"
              isOnline={isOnline}
              lastSeen={lastSeen}
              size="lg"
            />
            <span className="text-xs text-retro-textMuted">LG</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <UserAvatar
              userId="demo5"
              userName="钱七"
              isOnline={isOnline}
              lastSeen={lastSeen}
              size="xl"
            />
            <span className="text-xs text-retro-textMuted">XL</span>
          </div>
        </div>
      </div>

      {/* Last Seen Display Demo */}
      <div className="space-y-4">
        <h3 className="text-white text-lg font-semibold">最后在线时间显示</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <span className="text-retro-textMuted w-16">智能:</span>
            <LastSeenDisplay lastSeen={lastSeen} isOnline={isOnline} format="smart" />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-retro-textMuted w-16">相对:</span>
            <LastSeenDisplay lastSeen={lastSeen} isOnline={isOnline} format="relative" />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-retro-textMuted w-16">绝对:</span>
            <LastSeenDisplay lastSeen={lastSeen} isOnline={isOnline} format="absolute" />
          </div>
        </div>
      </div>

      {/* Conversation Participants Demo */}
      <div className="space-y-4">
        <h3 className="text-white text-lg font-semibold">对话参与者状态</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-retro-textMuted text-sm mb-2">水平布局:</h4>
            <ConversationParticipantStatus
              participants={mockParticipants}
              currentUserId="current-user"
              layout="horizontal"
              showAvatars={true}
              showLastSeen={true}
            />
          </div>
          <div>
            <h4 className="text-retro-textMuted text-sm mb-2">垂直布局:</h4>
            <ConversationParticipantStatus
              participants={mockParticipants}
              currentUserId="current-user"
              layout="vertical"
              showAvatars={true}
              showLastSeen={true}
            />
          </div>
          <div>
            <h4 className="text-retro-textMuted text-sm mb-2">网格布局:</h4>
            <ConversationParticipantStatus
              participants={mockParticipants}
              currentUserId="current-user"
              layout="grid"
              showAvatars={true}
              showLastSeen={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}