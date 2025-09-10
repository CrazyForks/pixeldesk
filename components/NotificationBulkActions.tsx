'use client'

import { useState } from 'react'
import { ChatNotification } from '../types/chat'

interface NotificationBulkActionsProps {
  notifications: ChatNotification[]
  selectedNotifications: string[]
  onSelectAll: () => void
  onSelectNone: () => void
  onMarkSelectedAsRead: () => void
  onDeleteSelected: () => void
  onMarkAllRead: () => void
  onClearAll: () => void
  isVisible: boolean
}

export default function NotificationBulkActions({
  notifications,
  selectedNotifications,
  onSelectAll,
  onSelectNone,
  onMarkSelectedAsRead,
  onDeleteSelected,
  onMarkAllRead,
  onClearAll,
  isVisible
}: NotificationBulkActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible || notifications.length === 0) {
    return null
  }

  const hasSelection = selectedNotifications.length > 0
  const isAllSelected = selectedNotifications.length === notifications.length

  const bulkActions = [
    {
      label: isAllSelected ? '取消全选' : '全选',
      icon: isAllSelected ? '☐' : '☑',
      action: isAllSelected ? onSelectNone : onSelectAll,
      disabled: false
    },
    {
      label: `标记已读 (${selectedNotifications.length})`,
      icon: '✓',
      action: onMarkSelectedAsRead,
      disabled: !hasSelection
    },
    {
      label: `删除 (${selectedNotifications.length})`,
      icon: '🗑',
      action: onDeleteSelected,
      disabled: !hasSelection,
      className: 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
    },
    {
      label: '全部已读',
      icon: '✓✓',
      action: onMarkAllRead,
      disabled: false
    },
    {
      label: '清空全部',
      icon: '🗑🗑',
      action: onClearAll,
      disabled: false,
      className: 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
    }
  ]

  return (
    <div className="relative">
      {/* Bulk Actions Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-3 py-2 bg-retro-bg-darker border border-retro-border rounded-lg hover:bg-retro-border/20 transition-colors"
        title="批量操作"
      >
        <span className="text-sm">⚙️</span>
        <span className="text-sm text-white">批量操作</span>
        {hasSelection && (
          <span className="bg-retro-purple text-white text-xs rounded-full px-2 py-1">
            {selectedNotifications.length}
          </span>
        )}
        <svg 
          className={`w-4 h-4 text-retro-textMuted transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Bulk Actions Menu */}
      {isExpanded && (
        <div className="absolute top-full left-0 mt-2 bg-retro-bg-darker border border-retro-border rounded-lg shadow-2xl py-2 min-w-[200px] z-50 animate-fade-in">
          {/* Selection Info */}
          <div className="px-3 py-2 border-b border-retro-border">
            <div className="flex items-center justify-between">
              <span className="text-retro-text text-sm">
                已选择 {selectedNotifications.length} / {notifications.length}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-retro-textMuted hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Action Items */}
          <div className="py-1">
            {bulkActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action()
                  if (action.label.includes('全部') || action.label.includes('清空')) {
                    setIsExpanded(false)
                  }
                }}
                disabled={action.disabled}
                className={`w-full px-3 py-2 text-left flex items-center space-x-3 transition-colors ${
                  action.disabled 
                    ? 'text-retro-textMuted cursor-not-allowed opacity-50' 
                    : action.className || 'text-retro-text hover:text-white hover:bg-retro-border/20'
                }`}
              >
                <span className="text-sm">{action.icon}</span>
                <span className="text-sm">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="px-3 py-2 border-t border-retro-border">
            <div className="text-retro-textMuted text-xs space-y-1">
              <div>总通知: {notifications.length}</div>
              <div>未读: {notifications.filter(n => !n.isRead).length}</div>
              {hasSelection && (
                <div className="text-retro-purple">已选择: {selectedNotifications.length}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}