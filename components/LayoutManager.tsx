'use client'

import { useState, useEffect, ReactNode } from 'react'

interface LayoutManagerProps {
  gameComponent: ReactNode
  infoPanel: ReactNode
}

interface LayoutConfig {
  desktop: {
    gameArea: {
      width: string
      height: string
    }
    infoPanel: {
      width: string
      height: string
      position: 'left' | 'right'
    }
  }
  mobile: {
    gameArea: {
      width: string
      height: string
    }
    infoPanel: {
      width: string
      height: string
      position: 'top' | 'bottom'
    }
  }
}

const defaultLayoutConfig: LayoutConfig = {
  desktop: {
    gameArea: {
      width: 'calc(100% - 400px)',
      height: '100vh'
    },
    infoPanel: {
      width: '400px',
      height: '100vh',
      position: 'right'
    }
  },
  mobile: {
    gameArea: {
      width: '100%',
      height: '60vh'
    },
    infoPanel: {
      width: '100%',
      height: '40vh',
      position: 'bottom'
    }
  }
}

export default function LayoutManager({ gameComponent, infoPanel }: LayoutManagerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [layoutConfig] = useState<LayoutConfig>(defaultLayoutConfig)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile layout: game on top, info on bottom
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Game area */}
        <div 
          className="relative"
          style={{
            width: layoutConfig.mobile.gameArea.width,
            height: layoutConfig.mobile.gameArea.height
          }}
        >
          {gameComponent}
        </div>
        
        {/* Info panel */}
        <div 
          className="bg-white border-t border-gray-200 overflow-hidden"
          style={{
            width: layoutConfig.mobile.infoPanel.width,
            height: layoutConfig.mobile.infoPanel.height
          }}
        >
          {infoPanel}
        </div>
      </div>
    )
  }

  // Desktop layout: game on left, info on right
  return (
    <div className="flex h-screen bg-gradient-to-br from-retro-bg-darker via-retro-bg-dark to-retro-bg-darker">
      {/* Game area - Left side */}
      <div 
        className="relative bg-black/30 overflow-hidden"
        style={{
          width: layoutConfig.desktop.gameArea.width,
          height: layoutConfig.desktop.gameArea.height
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-900/10 pointer-events-none"></div>
        {gameComponent}
      </div>
      
      {/* Info panel - Right side */}
      <div 
        className="bg-retro-bg-darker/80 backdrop-blur-lg border-l border-retro-border flex flex-col overflow-auto"
        style={{
          width: layoutConfig.desktop.infoPanel.width,
          height: layoutConfig.desktop.infoPanel.height
        }}
      >
        {infoPanel}
      </div>
    </div>
  )
}