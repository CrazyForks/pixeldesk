'use client'

import { useState, useEffect, ReactNode, ComponentType } from 'react'
import { EventBus, CollisionEvent, TabSwitchEvent } from '../lib/eventBus'

// Tab type definitions
export interface TabType {
  id: string
  label: string
  icon: string
  component: ComponentType<any>
  badge?: number
  autoSwitch?: boolean
  priority?: number
}

export interface TabManagerProps {
  tabs: TabType[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  collisionPlayer?: any
  className?: string
}

interface TabState {
  activeTabId: string
  animationState: 'idle' | 'switching'
  switchDirection: 'left' | 'right'
  lastSwitchTrigger: 'collision' | 'manual' | 'auto'
}

export default function TabManager({ 
  tabs, 
  activeTab, 
  onTabChange, 
  collisionPlayer,
  className = ''
}: TabManagerProps) {
  const [tabState, setTabState] = useState<TabState>({
    activeTabId: activeTab || tabs[0]?.id || '',
    animationState: 'idle',
    switchDirection: 'right',
    lastSwitchTrigger: 'manual'
  })

  const [currentCollisionPlayer, setCurrentCollisionPlayer] = useState<any>(null)

  // Handle tab switching with animation
  const handleTabSwitch = (newTabId: string, trigger: 'collision' | 'manual' | 'auto' = 'manual') => {
    if (newTabId === tabState.activeTabId) return

    const currentIndex = tabs.findIndex(tab => tab.id === tabState.activeTabId)
    const newIndex = tabs.findIndex(tab => tab.id === newTabId)
    const direction = newIndex > currentIndex ? 'right' : 'left'

    // Emit tab switch event
    const tabSwitchEvent: TabSwitchEvent = {
      type: 'tab_switch',
      fromTab: tabState.activeTabId,
      toTab: newTabId,
      trigger,
      timestamp: Date.now()
    }
    EventBus.emit('tab:switch', tabSwitchEvent)

    setTabState(prev => ({
      ...prev,
      animationState: 'switching',
      switchDirection: direction,
      lastSwitchTrigger: trigger
    }))

    // Complete the switch after animation starts
    setTimeout(() => {
      setTabState(prev => ({
        ...prev,
        activeTabId: newTabId,
        animationState: 'idle'
      }))
      onTabChange?.(newTabId)
    }, 150)
  }

  // Set up event bus listeners for collision events
  useEffect(() => {
    const handleCollisionStart = (event: CollisionEvent) => {
      console.log('[TabManager] Collision start detected:', event)
      setCurrentCollisionPlayer(event.targetPlayer)
      
      // Find player interaction tab and switch to it
      const playerInteractionTab = tabs.find(tab => tab.id === 'player-interaction')
      if (playerInteractionTab) {
        handleTabSwitch(playerInteractionTab.id, 'collision')
      }
    }

    const handleCollisionEnd = (event: CollisionEvent) => {
      console.log('[TabManager] Collision end detected:', event)
      setCurrentCollisionPlayer(null)
      
      // Switch back to default tab when collision ends
      const defaultTab = tabs.find(tab => tab.id === 'status-info')
      if (defaultTab && tabState.activeTabId === 'player-interaction' && tabState.lastSwitchTrigger === 'collision') {
        handleTabSwitch(defaultTab.id, 'auto')
      }
    }

    // Subscribe to collision events
    EventBus.on('player:collision:start', handleCollisionStart)
    EventBus.on('player:collision:end', handleCollisionEnd)

    // Cleanup on unmount
    return () => {
      EventBus.off('player:collision:start', handleCollisionStart)
      EventBus.off('player:collision:end', handleCollisionEnd)
    }
  }, [tabs, tabState.activeTabId, tabState.lastSwitchTrigger])

  // Legacy collision player prop support (for backward compatibility)
  useEffect(() => {
    if (collisionPlayer && !currentCollisionPlayer) {
      setCurrentCollisionPlayer(collisionPlayer)
      const playerInteractionTab = tabs.find(tab => tab.id === 'player-interaction')
      if (playerInteractionTab) {
        handleTabSwitch(playerInteractionTab.id, 'collision')
      }
    } else if (!collisionPlayer && currentCollisionPlayer) {
      setCurrentCollisionPlayer(null)
      const defaultTab = tabs.find(tab => tab.id === 'status-info')
      if (defaultTab && tabState.activeTabId === 'player-interaction') {
        handleTabSwitch(defaultTab.id, 'auto')
      }
    }
  }, [collisionPlayer, currentCollisionPlayer, tabs, tabState.activeTabId])

  // Update active tab when prop changes
  useEffect(() => {
    if (activeTab && activeTab !== tabState.activeTabId) {
      handleTabSwitch(activeTab, 'manual')
    }
  }, [activeTab])

  const activeTabData = tabs.find(tab => tab.id === tabState.activeTabId)

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-retro-border bg-retro-dark/50">
        {tabs.map((tab, index) => {
          const isActive = tab.id === tabState.activeTabId
          const isHighlighted = tab.id === 'player-interaction' && (currentCollisionPlayer || collisionPlayer)
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id, 'manual')}
              className={`
                relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'text-white bg-retro-purple/20 border-b-2 border-retro-purple' 
                  : 'text-retro-textMuted hover:text-white hover:bg-retro-purple/10'
                }
                ${isHighlighted ? 'animate-pulse bg-retro-pink/20' : ''}
                ${index === 0 ? 'rounded-tl-lg' : ''}
                ${index === tabs.length - 1 ? 'rounded-tr-lg' : ''}
              `}
            >
              {/* Tab Icon */}
              <span className="text-lg">{tab.icon}</span>
              
              {/* Tab Label */}
              <span className="hidden sm:inline">{tab.label}</span>
              
              {/* Badge */}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-retro-pink text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
              
              {/* Collision indicator */}
              {isHighlighted && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-retro-pink rounded-full animate-ping"></div>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className={`
            absolute inset-0 transition-all duration-300 ease-in-out
            ${tabState.animationState === 'switching' 
              ? `transform ${tabState.switchDirection === 'right' ? 'translate-x-full' : '-translate-x-full'} opacity-0`
              : 'transform translate-x-0 opacity-100'
            }
          `}
        >
          {activeTabData && (
            <activeTabData.component 
              collisionPlayer={currentCollisionPlayer || collisionPlayer}
              isActive={tabState.activeTabId === activeTabData.id}
            />
          )}
        </div>
        
        {/* Loading state during animation */}
        {tabState.animationState === 'switching' && (
          <div className="absolute inset-0 flex items-center justify-center bg-retro-dark/50">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-retro-purple rounded-full animate-pulse"></div>
              <span className="text-retro-textMuted text-sm">切换中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}