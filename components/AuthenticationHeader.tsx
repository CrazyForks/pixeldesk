'use client'

import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import AuthModal from './AuthModal'
import UserSettingsModal from './UserSettingsModal'

export default function AuthenticationHeader() {
  const { user, isLoading } = useUser()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 bg-retro-purple/50 rounded animate-pulse"></div>
        <span className="text-retro-textMuted text-sm">加载中...</span>
      </div>
    )
  }

  if (!user) {
    // User not authenticated - show login/register buttons
    return (
      <>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setAuthModalMode('login')
              setAuthModalOpen(true)
            }}
            className="px-3 py-1 text-sm bg-retro-border/30 hover:bg-retro-border/50 text-white rounded border border-retro-border transition-all duration-200"
          >
            登录
          </button>
          <button
            onClick={() => {
              setAuthModalMode('register')
              setAuthModalOpen(true)
            }}
            className="px-3 py-1 text-sm bg-gradient-to-r from-retro-purple to-retro-pink hover:from-retro-purple/90 hover:to-retro-pink/90 text-white rounded transition-all duration-200"
          >
            注册
          </button>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    )
  }

  // User authenticated - show user info and controls
  return (
    <>
      <div className="flex items-center space-x-3">
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-retro-border/30 flex items-center justify-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-retro-textMuted text-sm">👤</span>
          )}
        </div>

        {/* User Info */}
        <div className="hidden sm:flex flex-col">
          <span className="text-white text-sm font-medium">{user.name}</span>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-retro-textMuted">
              积分: {user.points || 0}
            </span>
            <span className="text-retro-textMuted">
              金币: {user.gold || 0}
            </span>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-2 hover:bg-retro-border/30 rounded transition-all duration-200"
          title="用户设置"
        >
          <svg
            className="w-4 h-4 text-retro-textMuted hover:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      <UserSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </>
  )
}