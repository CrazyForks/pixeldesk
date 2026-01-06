'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { initializePlayerSync, clearPlayerFromLocalStorage } from '@/lib/playerSync'
import { migrateTempPlayerToUser, clearTempPlayer } from '@/lib/tempPlayerManager'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  points?: number
  emailVerified?: boolean
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  playerExists: boolean | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setPlayerExists: (exists: boolean) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// 全局 Promise 缓存,防止并发重复请求
let settingsLoadingPromise: Promise<Response> | null = null
let settingsCache: { data: User | null; timestamp: number } | null = null
const SETTINGS_CACHE_DURATION = 30 * 1000 // 30秒缓存

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [playerExists, setPlayerExists] = useState<boolean | null>(null)
  const authCheckedRef = useRef(false) // 防止 React Strict Mode 重复请求

  // Check for existing session on mount
  useEffect(() => {
    // 防止重复请求（React Strict Mode 会导致 useEffect 执行两次）
    if (authCheckedRef.current) return
    authCheckedRef.current = true

    const checkAuth = async () => {
      try {
        // 检查缓存
        if (settingsCache && Date.now() - settingsCache.timestamp < SETTINGS_CACHE_DURATION) {
          console.log('📦 [UserContext] 使用缓存的用户设置')
          if (settingsCache.data) {
            setUser(settingsCache.data)
            const playerSyncResult = await initializePlayerSync()
            setPlayerExists(playerSyncResult.hasPlayer)
          }
          setIsLoading(false)
          return
        }

        // 如果正在加载,等待现有的 Promise
        if (settingsLoadingPromise) {
          console.log('⏳ [UserContext] 等待现有的设置请求')
          const response = await settingsLoadingPromise
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.data) {
              setUser(data.data)
              const playerSyncResult = await initializePlayerSync()
              setPlayerExists(playerSyncResult.hasPlayer)
            }
          }
          setIsLoading(false)
          return
        }

        // 创建新的加载 Promise
        console.log('🌐 [UserContext] 发起新的设置请求')
        settingsLoadingPromise = fetch('/api/auth/settings', {
          method: 'GET',
          credentials: 'include',
        })

        const response = await settingsLoadingPromise

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setUser(data.data)
            // 更新缓存
            settingsCache = { data: data.data, timestamp: Date.now() }
            // Initialize player sync for authenticated user
            const playerSyncResult = await initializePlayerSync()
            setPlayerExists(playerSyncResult.hasPlayer)
          } else {
            settingsCache = { data: null, timestamp: Date.now() }
          }
        } else {
          // 忽略预期的认证失败日志以优化性能
          settingsCache = { data: null, timestamp: Date.now() }
        }
      } catch (error) {
        // 静默处理认证错误以减少日志噪音
      } finally {
        settingsLoadingPromise = null
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUser(data.data)

          // 处理临时玩家迁移
          const migrationResult = migrateTempPlayerToUser(data.data.id)
          if (migrationResult.migrationSuccess) {
            // 临时玩家数据迁移成功
            console.log('临时玩家数据已迁移到正式用户')
          }

          // Clear any existing player data from localStorage for the user
          clearPlayerFromLocalStorage()
          clearTempPlayer() // 清理临时玩家数据

          // Initialize player sync after successful login
          const playerSyncResult = await initializePlayerSync()
          setPlayerExists(playerSyncResult.hasPlayer)

          // 🔧 新增：通知Phaser游戏刷新玩家和工位状态
          if (typeof window !== 'undefined') {
            // 触发游戏刷新事件
            window.dispatchEvent(new CustomEvent('user-login-success', {
              detail: {
                userId: data.data.id,
                characterSprite: playerSyncResult.player?.characterSprite,
                needsRefresh: true
              }
            }))
          }

          return true
        }
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Registration successful, user is automatically logged in
        setUser(data.data)

        // 处理临时玩家迁移
        const migrationResult = migrateTempPlayerToUser(data.data.id)
        if (migrationResult.migrationSuccess) {
          // 临时玩家数据迁移成功
        }

        // Clear any existing player data from localStorage for new user
        clearPlayerFromLocalStorage()
        clearTempPlayer() // 清理临时玩家数据

        // Initialize player sync after successful registration to check for player existence
        // For new users, this will set playerExists to false, triggering character creation modal
        const playerSyncResult = await initializePlayerSync()
        setPlayerExists(playerSyncResult.hasPlayer)

        return { success: true }
      } else {
        return { success: false, error: data.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  const logout = async () => {
    try {
      // Call logout API to invalidate session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear user state and player data regardless of API success
      setUser(null)
      setPlayerExists(null)
      await clearPlayerFromLocalStorage()
    }
  }

  const refreshUser = async () => {
    try {
      // 清除缓存,强制重新加载
      settingsCache = null

      // 如果正在加载,等待现有的 Promise
      if (settingsLoadingPromise) {
        console.log('⏳ [UserContext.refreshUser] 等待现有的设置请求')
        const response = await settingsLoadingPromise
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setUser(data.data)
          }
        }
        return
      }

      // 创建新的加载 Promise
      console.log('🌐 [UserContext.refreshUser] 发起新的设置请求')
      settingsLoadingPromise = fetch('/api/auth/settings', {
        method: 'GET',
        credentials: 'include',
      })

      const response = await settingsLoadingPromise

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setUser(data.data)
          // 更新缓存
          settingsCache = { data: data.data, timestamp: Date.now() }
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    } finally {
      settingsLoadingPromise = null
    }
  }

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      playerExists,
      login,
      register,
      logout,
      refreshUser,
      setPlayerExists
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}