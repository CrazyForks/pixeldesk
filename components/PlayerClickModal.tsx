'use client'

import { useState, useCallback, memo, useRef, useEffect } from 'react'

interface PlayerClickModalProps {
  isVisible: boolean
  player: any
  onClose: () => void
}

interface WorkstationAd {
  workstationId: number
  adText: string | null
  adImage: string | null
  adUrl: string | null
  adUpdatedAt: string | null
}

const PlayerClickModal = memo(({
  isVisible,
  player,
  onClose
}: PlayerClickModalProps) => {
  const [activeTab, setActiveTab] = useState<'status' | 'interaction' | 'info'>('status')
  const inputRef = useRef<HTMLInputElement>(null)
  const [workstationAd, setWorkstationAd] = useState<WorkstationAd | null>(null)
  const [isLoadingAd, setIsLoadingAd] = useState(false)

  // 监听标签切换，自动聚焦输入框
  useEffect(() => {
    if (isVisible && activeTab === 'interaction') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isVisible, activeTab])

  // 获取玩家的工位广告信息
  useEffect(() => {
    const fetchWorkstationAd = async () => {
      if (!isVisible || !player?.id) return

      setIsLoadingAd(true)
      try {
        // 1. 获取玩家绑定的工位信息
        const bindingResponse = await fetch(`/api/workstations/user-bindings?userId=${player.id}`)
        const bindingResult = await bindingResponse.json()

        if (bindingResult.success && bindingResult.data && bindingResult.data.length > 0) {
          // 获取第一个有效的工位绑定
          const binding = bindingResult.data[0]

          // 2. 获取该工位的广告信息
          const adResponse = await fetch(`/api/workstations/${binding.workstationId}/advertisement`)
          const adResult = await adResponse.json()

          if (adResult.success && adResult.data && (adResult.data.adText || adResult.data.adImage)) {
            setWorkstationAd({
              workstationId: binding.workstationId,
              adText: adResult.data.adText,
              adImage: adResult.data.adImage,
              adUrl: adResult.data.adUrl,
              adUpdatedAt: adResult.data.adUpdatedAt
            })
          } else {
            setWorkstationAd(null)
          }
        } else {
          setWorkstationAd(null)
        }
      } catch (error) {
        console.error('Failed to fetch workstation ad:', error)
        setWorkstationAd(null)
      } finally {
        setIsLoadingAd(false)
      }
    }

    fetchWorkstationAd()
  }, [isVisible, player?.id])

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
      working: 'from-retro-blue to-retro-cyan',
      break: 'from-retro-green to-retro-blue',
      reading: 'from-retro-purple to-retro-pink',
      restroom: 'from-retro-yellow to-retro-orange',
      meeting: 'from-retro-red to-retro-pink',
      lunch: 'from-retro-orange to-retro-yellow'
    }
    return badges[type] || 'from-retro-textMuted to-retro-border'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 现代像素风格背景 */}
      <div
        className="absolute inset-0 bg-retro-bg-darker "
        onClick={handleClose}
      />

      {/* 模态框容器 - 现代像素艺术设计 */}
      <div className="relative bg-retro-bg-darker border-2 border-retro-border rounded-2xl p-8 w-full max-w-lg shadow-2xl shadow-retro-purple/20 ">
        {/* 装饰性光效 */}
        <div className="absolute inset-0 bg-gradient-to-br from-retro-purple/5 via-retro-blue/8 to-retro-pink/5 rounded-2xl "></div>
        <div className="absolute inset-0 border border-retro-purple/20 rounded-2xl "></div>

        {/* 关闭按钮 - 像素化设计 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-retro-red/20 to-retro-orange/20 hover:from-retro-red/30 hover:to-retro-orange/30 text-white/80 hover:text-white rounded-lg border-2 border-retro-red/30 hover:border-retro-red/50  flex items-center justify-center shadow-lg group"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100  rounded-lg"></div>
          <span className="relative font-bold">✕</span>
        </button>

        {/* 玩家信息头部 - 现代像素艺术卡片 */}
        <div className="relative mb-8">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/10 to-retro-pink/10 rounded-xl opacity-60 pointer-events-none"></div>

          <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-5 mb-4">
              {/* 像素化头像容器 */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-retro-purple via-retro-pink to-retro-blue rounded-xl flex items-center justify-center shadow-xl border-2 border-white/20 group-hover:shadow-retro-purple/50 ">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-xl"></div>
                  <span className="relative text-2xl font-bold text-white font-pixel drop-shadow-lg">
                    {player.name?.charAt(0) || 'P'}
                  </span>
                </div>
                {/* 在线状态指示器 */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-retro-green to-retro-cyan rounded-full border-2 border-retro-bg-darker shadow-lg">
                  <div className="w-full h-full bg-retro-green rounded-full  opacity-60"></div>
                </div>
              </div>

              {/* 用户信息区域 */}
              <div className="flex-1 space-y-3">
                <h2 className="text-white text-2xl font-bold font-pixel tracking-wide drop-shadow-sm">
                  {player.name || '未知玩家'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusBadge(player.currentStatus?.type || 'working')} border border-white/20 shadow-lg`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{player.currentStatus?.emoji || '💼'}</span>
                      <span className="text-white text-sm font-bold font-pixel tracking-wide">
                        {player.currentStatus?.status || '在线'}
                      </span>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-retro-green rounded-full  shadow-lg"></div>
                </div>
              </div>
            </div>

            {/* 装饰性分割线 */}
            <div className="w-16 h-2 bg-gradient-to-r from-retro-purple via-retro-pink to-retro-blue rounded-full shadow-lg"></div>
          </div>
        </div>

        {/* 选项卡导航 - 现代像素风格 */}
        <div className="relative flex space-x-3 mb-8 pb-4 border-b-2 border-retro-border/50">
          {[
            { id: 'status', label: 'HISTORY', icon: '📊' },
            { id: 'interaction', label: 'INTERACT', icon: '🎮' },
            { id: 'info', label: 'INFO', icon: '👤' }
          ].map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group relative overflow-hidden flex items-center gap-2 px-4 py-3 rounded-xl border-2  ${isActive
                  ? 'bg-gradient-to-r from-retro-purple/30 to-retro-blue/30 text-white border-retro-purple/50 shadow-lg shadow-retro-purple/20'
                  : 'text-retro-textMuted hover:text-white border-retro-border hover:border-retro-blue/30 hover:bg-gradient-to-r hover:from-retro-blue/10 hover:to-retro-cyan/10'
                  } ${isActive ? '' : 'hover:scale-105'}`}
              >
                {/* 激活状态光效 */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl "></div>
                )}

                {/* 选项卡内容 */}
                <div className="relative flex items-center gap-2">
                  <div className={`w-5 h-5 ${isActive ? 'bg-white/20' : 'bg-retro-textMuted/20'} rounded flex items-center justify-center `}>
                    <span className="text-xs">{tab.icon}</span>
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${isActive ? 'font-pixel' : 'font-retro'}`}>
                    {tab.label}
                  </span>
                </div>

                {/* 激活指示器 */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-retro-purple rounded-full "></div>
                )}
              </button>
            )
          })}
        </div>

        {/* 标签页内容 - 现代像素风格 */}
        <div className="relative space-y-6">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-retro-orange/2 via-retro-yellow/4 to-retro-red/2 rounded-xl opacity-60 pointer-events-none"></div>

          {activeTab === 'status' && (
            <div className="relative space-y-4">
              {/* 状态历史标题 */}
              <div className="flex items-center gap-3 pb-3 border-b border-retro-border/30">
                <div className="w-6 h-6 bg-gradient-to-br from-retro-orange to-retro-yellow rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm">📊</span>
                </div>
                <h3 className="text-white font-bold text-base font-pixel tracking-wide">STATUS TIMELINE</h3>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-2 h-2 bg-retro-orange rounded-full "></div>
                  <span className="text-xs text-retro-textMuted font-retro">{playerHistory.length} RECORDS</span>
                </div>
              </div>

              {/* 状态历史列表 */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2 scrollbar-hide">
                {playerHistory.map((history, index) => (
                  <div key={history.id} className="group relative " style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/5 to-retro-pink/5 rounded-xl opacity-0 group-hover:opacity-100 "></div>
                    <div className="relative bg-gradient-to-br from-retro-bg-dark/60 to-retro-bg-darker/60 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-4 shadow-lg hover:border-retro-purple/40 hover:shadow-xl ">
                      <div className="flex items-start justify-between mb-3">
                        {/* 状态标签 */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusBadge(history.type)} border border-white/20 shadow-lg`}>
                          <span className="text-sm">{history.emoji}</span>
                          <span className="text-white text-sm font-bold font-pixel tracking-wide">
                            {history.status}
                          </span>
                        </div>

                        {/* 时间戳 */}
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-retro-textMuted rounded-full"></div>
                          <span className="text-retro-textMuted text-xs font-retro tracking-wide">
                            {history.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* 状态消息 */}
                      <p className="text-retro-text text-sm font-retro leading-relaxed pl-2 border-l-2 border-retro-purple/30">
                        {history.message}
                      </p>

                      {/* 历史记录序号 */}
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-retro-textMuted/20 to-retro-border/20 rounded-full flex items-center justify-center border border-retro-textMuted/30">
                        <span className="text-xs font-bold font-pixel text-retro-textMuted">
                          {playerHistory.length - index}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'interaction' && (
            <div className="relative space-y-5">
              {/* 互动区域标题 */}
              <div className="flex items-center gap-3 pb-3 border-b border-retro-border/30">
                <div className="w-6 h-6 bg-gradient-to-br from-retro-blue to-retro-cyan rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm">🎮</span>
                </div>
                <h3 className="text-white font-bold text-base font-pixel tracking-wide">QUICK INTERACTIONS</h3>
              </div>

              {/* 快速互动按钮组 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-retro-blue/5 to-retro-cyan/5 rounded-xl opacity-60 pointer-events-none"></div>
                <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-5 shadow-lg">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { emoji: '👋', label: 'WAVE', action: 'wave', color: 'from-retro-blue/20 to-retro-cyan/20 border-retro-blue/30' },
                      { emoji: '🎉', label: 'CELEBRATE', action: 'celebrate', color: 'from-retro-green/20 to-retro-blue/20 border-retro-green/30' },
                      { emoji: '👍', label: 'LIKE', action: 'like', color: 'from-retro-purple/20 to-retro-pink/20 border-retro-purple/30' },
                      { emoji: '❤️', label: 'LOVE', action: 'love', color: 'from-retro-pink/20 to-retro-red/20 border-retro-pink/30' }
                    ].map((action) => (
                      <button
                        key={action.action}
                        className={`group relative overflow-hidden bg-gradient-to-br ${action.color} hover:shadow-lg text-white py-3 px-4 rounded-xl border-2  shadow-md hover:shadow-xl transform hover:scale-105 active:scale-95 backdrop-blur-sm`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 "></div>
                        <div className="relative flex flex-col items-center gap-2">
                          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                            <span className="text-sm">{action.emoji}</span>
                          </div>
                          <span className="text-xs font-bold font-pixel tracking-wide">{action.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 消息发送区域 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/5 to-retro-pink/5 rounded-xl opacity-60 pointer-events-none"></div>
                <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-gradient-to-br from-retro-purple/30 to-retro-pink/30 rounded flex items-center justify-center">
                      <span className="text-xs">💬</span>
                    </div>
                    <span className="text-xs text-retro-textMuted font-pixel tracking-wide">SEND MESSAGE</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/10 to-retro-pink/10 rounded-xl opacity-0 group-focus-within:opacity-100  blur-sm"></div>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message..."
                        className="relative w-full bg-gradient-to-br from-retro-bg-dark/80 to-retro-bg-darker/80 border-2 border-retro-border focus:border-retro-purple rounded-xl px-4 py-3 text-white placeholder-retro-textMuted focus:outline-none backdrop-blur-md  font-retro text-sm focus:shadow-lg focus:shadow-retro-purple/20"
                        onFocus={() => {
                          if (typeof window !== 'undefined' && (window as any).disableGameKeyboard) {
                            (window as any).disableGameKeyboard()
                          }
                        }}
                        onBlur={() => {
                          if (typeof window !== 'undefined' && (window as any).enableGameKeyboard) {
                            (window as any).enableGameKeyboard()
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            (e.target as HTMLInputElement).blur()
                          }
                        }}
                      />
                    </div>
                    <button className="group relative overflow-hidden bg-gradient-to-br from-retro-purple/30 to-retro-pink/30 hover:from-retro-purple/40 hover:to-retro-pink/40 text-white px-6 py-3 rounded-xl border-2 border-retro-purple/40 hover:border-retro-purple/60  shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 "></div>
                      <div className="relative flex items-center gap-2">
                        <div className="w-4 h-4 bg-white/20 rounded flex items-center justify-center">
                          <span className="text-xs">🚀</span>
                        </div>
                        <span className="font-pixel text-sm tracking-wide">SEND</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="relative space-y-5">
              {/* 信息区域标题 */}
              <div className="flex items-center gap-3 pb-3 border-b border-retro-border/30">
                <div className="w-6 h-6 bg-gradient-to-br from-retro-cyan to-retro-blue rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-sm">👤</span>
                </div>
                <h3 className="text-white font-bold text-base font-pixel tracking-wide">PLAYER INFO</h3>
              </div>

              {/* 基本信息卡片 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-retro-cyan/5 to-retro-blue/5 rounded-xl opacity-60 pointer-events-none"></div>
                <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-5 shadow-lg">
                  <div className="space-y-4">
                    {[
                      { label: 'PLAYER ID', value: player.id, icon: '🆔' },
                      { label: 'CURRENT STATUS', value: player.currentStatus?.status || '在线', icon: '📊' },
                      { label: 'STATUS MESSAGE', value: player.currentStatus?.message || '无', icon: '💬' },
                      { label: 'LAST UPDATE', value: new Date(player.currentStatus?.timestamp).toLocaleTimeString() || '刚刚', icon: '⏰' }
                    ].map((info, index) => (
                      <div key={index} className="group relative bg-gradient-to-r from-retro-bg-darker/30 to-retro-bg-dark/30 rounded-lg p-3 border border-retro-border/30 hover:border-retro-cyan/40 ">
                        <div className="absolute inset-0 bg-gradient-to-r from-retro-cyan/3 to-retro-blue/3 opacity-0 group-hover:opacity-100  rounded-lg"></div>
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-retro-cyan/30 to-retro-blue/30 rounded-lg flex items-center justify-center shadow-lg">
                              <span className="text-sm">{info.icon}</span>
                            </div>
                            <span className="text-retro-textMuted text-sm font-pixel tracking-wide">{info.label}</span>
                          </div>
                          <span className="text-white text-sm font-retro max-w-[200px] truncate">
                            {info.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 工位广告卡片 */}
              {isLoadingAd ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-retro-yellow/5 to-retro-orange/5 rounded-xl opacity-60 pointer-events-none"></div>
                  <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-center gap-3 text-retro-textMuted">
                      <div className="w-5 h-5 border-2 border-retro-yellow border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-retro">加载工位信息...</span>
                    </div>
                  </div>
                </div>
              ) : workstationAd ? (
                <div className="relative">
                  {/* 名片容器 - 可点击 */}
                  {workstationAd.adUrl ? (
                    <a
                      href={workstationAd.adUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/95 via-orange-500/95 to-pink-500/95 shadow-2xl hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                    >
                      {/* 像素点装饰背景 */}
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)
                        `,
                        backgroundSize: '8px 8px'
                      }}></div>

                      {/* 顶部光晕效果 */}
                      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/30 to-transparent"></div>

                      {/* 点击提示图标 */}
                      <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>

                      {/* 内容区域 */}
                      <div className="relative p-6">
                        {/* 标题栏 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-sm shadow-lg"></div>
                            <span className="text-white font-pixel text-sm tracking-widest drop-shadow-lg uppercase">
                              WORKSTATION #{workstationAd.workstationId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-sm animate-pulse"></div>
                            <div className="w-2 h-2 bg-white/70 rounded-sm animate-pulse delay-75"></div>
                            <div className="w-2 h-2 bg-white/40 rounded-sm animate-pulse delay-150"></div>
                          </div>
                        </div>

                        {/* 广告图片 */}
                        {workstationAd.adImage && (
                          <div className="relative mb-4 rounded-xl overflow-hidden shadow-xl">
                            <img
                              src={workstationAd.adImage}
                              alt="工位广告"
                              className="w-full h-auto object-cover max-h-48"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        )}

                        {/* 广告文案 */}
                        {workstationAd.adText && (
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg mb-3">
                            <p className="text-gray-800 text-base font-retro leading-relaxed whitespace-pre-wrap break-words">
                              {workstationAd.adText}
                            </p>
                          </div>
                        )}

                        {/* 底部装饰线 + 时间戳 */}
                        <div className="flex items-center justify-between pt-3">
                          <div className="flex gap-1">
                            <div className="w-8 h-0.5 bg-white/60 rounded-full"></div>
                            <div className="w-4 h-0.5 bg-white/40 rounded-full"></div>
                            <div className="w-2 h-0.5 bg-white/20 rounded-full"></div>
                          </div>
                          {workstationAd.adUpdatedAt && (
                            <span className="text-white/80 text-xs font-pixel tracking-wide">
                              {new Date(workstationAd.adUpdatedAt).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 右下角像素装饰 */}
                      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-20">
                        <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-sm"></div>
                        <div className="absolute bottom-2 right-6 w-2 h-2 bg-white rounded-sm"></div>
                        <div className="absolute bottom-6 right-2 w-2 h-2 bg-white rounded-sm"></div>
                      </div>
                    </a>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/95 via-orange-500/95 to-pink-500/95 shadow-2xl">
                      {/* 像素点装饰背景 */}
                      <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `
                          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)
                        `,
                        backgroundSize: '8px 8px'
                      }}></div>

                      {/* 顶部光晕效果 */}
                      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/30 to-transparent"></div>

                      {/* 内容区域 */}
                      <div className="relative p-6">
                        {/* 标题栏 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-sm shadow-lg"></div>
                            <span className="text-white font-pixel text-sm tracking-widest drop-shadow-lg uppercase">
                              WORKSTATION #{workstationAd.workstationId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-sm animate-pulse"></div>
                            <div className="w-2 h-2 bg-white/70 rounded-sm animate-pulse delay-75"></div>
                            <div className="w-2 h-2 bg-white/40 rounded-sm animate-pulse delay-150"></div>
                          </div>
                        </div>

                        {/* 广告图片 */}
                        {workstationAd.adImage && (
                          <div className="relative mb-4 rounded-xl overflow-hidden shadow-xl">
                            <img
                              src={workstationAd.adImage}
                              alt="工位广告"
                              className="w-full h-auto object-cover max-h-48"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        )}

                        {/* 广告文案 */}
                        {workstationAd.adText && (
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg mb-3">
                            <p className="text-gray-800 text-base font-retro leading-relaxed whitespace-pre-wrap break-words">
                              {workstationAd.adText}
                            </p>
                          </div>
                        )}

                        {/* 底部装饰线 + 时间戳 */}
                        <div className="flex items-center justify-between pt-3">
                          <div className="flex gap-1">
                            <div className="w-8 h-0.5 bg-white/60 rounded-full"></div>
                            <div className="w-4 h-0.5 bg-white/40 rounded-full"></div>
                            <div className="w-2 h-0.5 bg-white/20 rounded-full"></div>
                          </div>
                          {workstationAd.adUpdatedAt && (
                            <span className="text-white/80 text-xs font-pixel tracking-wide">
                              {new Date(workstationAd.adUpdatedAt).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 右下角像素装饰 */}
                      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-20">
                        <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-sm"></div>
                        <div className="absolute bottom-2 right-6 w-2 h-2 bg-white rounded-sm"></div>
                        <div className="absolute bottom-6 right-2 w-2 h-2 bg-white rounded-sm"></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-retro-textMuted/5 to-retro-border/5 rounded-xl opacity-60 pointer-events-none"></div>
                  <div className="relative bg-gradient-to-br from-retro-bg-dark/50 to-retro-bg-darker/50 backdrop-blur-sm border-2 border-retro-border/50 rounded-xl p-5 shadow-lg">
                    <div className="flex flex-col items-center justify-center gap-3 text-retro-textMuted py-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-retro-textMuted/20 to-retro-border/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl opacity-50">📢</span>
                      </div>
                      <p className="text-sm font-retro text-center">该玩家暂未设置工位广告</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部操作按钮 - 现代像素风格 */}
        <div className="relative flex gap-4 mt-8 pt-6 border-t-2 border-retro-border/50">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-r from-retro-purple/3 via-retro-blue/5 to-retro-pink/3 opacity-60 pointer-events-none rounded-xl"></div>

          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="relative flex-1 group overflow-hidden bg-gradient-to-r from-retro-bg-dark/80 to-retro-bg-darker/80 hover:from-retro-border/60 hover:to-retro-border/80 text-white font-medium py-4 px-6 rounded-xl border-2 border-retro-border hover:border-retro-red/60  shadow-lg hover:shadow-xl backdrop-blur-sm "
          >
            {/* 按钮光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-retro-red/5 to-retro-orange/5 opacity-0 group-hover:opacity-100 "></div>

            {/* 按钮内容 */}
            <div className="relative flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-retro-red/20 rounded-lg flex items-center justify-center group-hover:bg-retro-red/30 ">
                <span className="text-sm">✕</span>
              </div>
              <span className="font-pixel text-base tracking-wide">CLOSE</span>
            </div>
          </button>

          {/* 关注按钮 */}
          <button
            onClick={() => {
              // 这里可以添加关注功能
              console.log('关注玩家:', player.name)
            }}
            className="relative flex-1 group overflow-hidden bg-gradient-to-r from-retro-purple via-retro-pink to-retro-blue hover:from-retro-blue hover:via-retro-cyan hover:to-retro-green text-white font-bold py-4 px-6 rounded-xl border-2 border-white/20 hover:border-white/40  shadow-lg hover:shadow-2xl  backdrop-blur-sm"
          >
            {/* 按钮光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100 "></div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 "></div>

            {/* 按钮内容 */}
            <div className="relative flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 ">
                <span className="text-sm">➕</span>
              </div>
              <span className="font-pixel text-base tracking-wide drop-shadow-lg">FOLLOW</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
})

export default PlayerClickModal