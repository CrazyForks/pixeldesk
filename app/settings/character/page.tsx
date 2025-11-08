'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'

interface OwnedCharacter {
  id: string
  name: string
  displayName: string
  description: string | null
  imageUrl: string | null
  frameWidth: number
  frameHeight: number
  totalFrames: number
  isCompactFormat: boolean
  price: number
  isDefault: boolean
  isCurrent: boolean
  purchasedAt: string | null
}

export default function CharacterSettingsPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<OwnedCharacter[]>([])
  const [currentCharacter, setCurrentCharacter] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchOwnedCharacters()
  }, [])

  const fetchOwnedCharacters = async () => {
    try {
      setIsLoading(true)

      // 获取token
      const token = localStorage.getItem('token')
      if (!token) {
        setError('请先登录')
        router.push('/login')
        return
      }

      const response = await fetch('/api/characters/owned', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setCharacters(data.data)
        setCurrentCharacter(data.currentCharacter)
      } else {
        if (response.status === 401) {
          setError('登录已过期，请重新登录')
          router.push('/login')
        } else {
          setError(data.error || '加载失败')
        }
      }
    } catch (err) {
      console.error('加载角色列表失败:', err)
      setError('加载角色列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitch = async (characterId: string, characterName: string, displayName: string) => {
    // 如果已经是当前角色，不需要切换
    if (characterName === currentCharacter) {
      return
    }

    try {
      setIsSwitching(characterId)
      setError(null)
      setSuccess(null)

      // 获取token
      const token = localStorage.getItem('token')
      if (!token) {
        setError('请先登录')
        router.push('/login')
        return
      }

      const response = await fetch('/api/characters/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characterId })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setCurrentCharacter(characterName)

        // 更新角色列表的当前状态
        setCharacters(prev =>
          prev.map(char => ({
            ...char,
            isCurrent: char.name === characterName
          }))
        )

        // 3秒后清除成功消息并刷新页面（让游戏加载新角色）
        setTimeout(() => {
          setSuccess(null)
          window.location.href = '/' // 回到游戏主页
        }, 2000)
      } else {
        if (response.status === 401) {
          setError('登录已过期，请重新登录')
          router.push('/login')
        } else {
          setError(data.error || '切换失败')
        }
      }
    } catch (err) {
      console.error('切换角色失败:', err)
      setError('切换失败，请重试')
    } finally {
      setIsSwitching(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* 头部导航 */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg">我的角色</span>
              <span className="text-gray-400 text-xs font-mono">My Characters</span>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/shop/characters')}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all"
            >
              角色商店
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg transition-all font-medium"
            >
              账号设置
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 消息提示 */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800/50 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-900/30 border border-emerald-800/50 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-emerald-300 text-sm">{success}</span>
          </div>
        )}

        {/* 提示信息 */}
        <div className="mb-6 bg-blue-900/30 border border-blue-800/50 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            💡 点击角色卡片即可切换到该角色，切换后将自动返回游戏
          </p>
        </div>

        {/* 角色列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <button
              key={character.id}
              onClick={() => handleSwitch(character.id, character.name, character.displayName)}
              disabled={isSwitching === character.id || character.isCurrent}
              className={`
                bg-gradient-to-br from-gray-900 to-gray-800 border rounded-2xl overflow-hidden
                transition-all cursor-pointer text-left
                ${character.isCurrent
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-500/50'
                  : 'border-gray-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20'
                }
                ${isSwitching === character.id ? 'opacity-50' : ''}
                disabled:cursor-not-allowed
              `}
            >
              {/* 角色图片 */}
              <div className="relative bg-gray-950 p-6 flex items-center justify-center" style={{ minHeight: '200px' }}>
                {character.imageUrl ? (
                  <Image
                    src={character.imageUrl}
                    alt={character.displayName}
                    width={character.isCompactFormat ? 192 : 384}
                    height={character.isCompactFormat ? 96 : 384}
                    className="pixelated object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}

                {/* 当前使用标识 */}
                {character.isCurrent && (
                  <div className="absolute top-2 right-2 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    当前使用
                  </div>
                )}

                {/* 免费标识 */}
                {character.isDefault && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    免费
                  </div>
                )}
              </div>

              {/* 角色信息 */}
              <div className="p-6">
                <h3 className="text-white text-xl font-bold mb-2">{character.displayName}</h3>

                {character.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{character.description}</p>
                )}

                {character.purchasedAt && (
                  <div className="text-gray-500 text-xs">
                    购买于 {new Date(character.purchasedAt).toLocaleDateString('zh-CN')}
                  </div>
                )}

                {isSwitching === character.id && (
                  <div className="mt-4 text-center text-cyan-400 text-sm">
                    切换中...
                  </div>
                )}

                {character.isCurrent && (
                  <div className="mt-4 text-center text-cyan-400 text-sm font-medium">
                    ✓ 正在使用此角色
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {characters.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-4">您还没有任何角色</p>
            <button
              onClick={() => router.push('/shop/characters')}
              className="cursor-pointer px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all"
            >
              前往商店购买
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
