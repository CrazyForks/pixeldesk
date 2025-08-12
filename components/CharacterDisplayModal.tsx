'use client'

import React, { useState, useEffect } from 'react'

interface CharacterDisplayProps {
  userId: string
  userInfo: {
    name?: string
    character?: string
    avatar?: string
  }
  position?: { x: number; y: number }
  onClose: () => void
}

export default function CharacterDisplayModal({ 
  userId, 
  userInfo, 
  position, 
  onClose 
}: CharacterDisplayProps) {
  const [characterImage, setCharacterImage] = useState<string>('/assets/characters/Premade_Character_48x48_01.png')
  
  useEffect(() => {
    // 设置角色图片
    if (userInfo.character || userInfo.avatar) {
      const characterKey = userInfo.character || userInfo.avatar
      setCharacterImage(`/assets/characters/${characterKey}.png`)
    }
  }, [userInfo.character, userInfo.avatar])

  const getCharacterName = () => {
    return userInfo.name || `玩家${userId.slice(-4)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">角色信息</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          {/* 角色头像 */}
          <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden">
            <img 
              src={characterImage}
              alt={getCharacterName()}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 如果图片加载失败，使用默认图片
                const target = e.target as HTMLImageElement
                target.src = '/assets/characters/Premade_Character_48x48_01.png'
              }}
            />
          </div>
          
          {/* 角色信息 */}
          <div className="text-center">
            <h4 className="text-xl font-semibold">{getCharacterName()}</h4>
            <p className="text-gray-600">ID: {userId}</p>
            {userInfo.character && (
              <p className="text-sm text-gray-500">
                角色: {userInfo.character}
              </p>
            )}
          </div>
          
          {/* 互动按钮 */}
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              打招呼 👋
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              点赞 👍
            </button>
            <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              关注 +
            </button>
          </div>
          
          {position && (
            <div className="text-sm text-gray-500">
              位置: ({position.x}, {position.y})
            </div>
          )}
        </div>
      </div>
    </div>
  )
}