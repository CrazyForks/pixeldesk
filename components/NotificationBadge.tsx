'use client'

import { useState, useEffect } from 'react'

interface NotificationBadgeProps {
  count: number
  maxCount?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'pulse' | 'glow'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline'
  className?: string
  showZero?: boolean
  animate?: boolean
}

export default function NotificationBadge({
  count,
  maxCount = 99,
  size = 'md',
  variant = 'default',
  position = 'top-right',
  className = '',
  showZero = false,
  animate = true
}: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevCount, setPrevCount] = useState(count)

  // Trigger animation when count changes
  useEffect(() => {
    if (animate && count !== prevCount && count > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      setPrevCount(count)
      return () => clearTimeout(timer)
    }
    setPrevCount(count)
  }, [count, prevCount, animate])

  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm'
  }

  // Position classes
  const positionClasses = {
    'top-right': 'absolute -top-1 -right-1',
    'top-left': 'absolute -top-1 -left-1',
    'bottom-right': 'absolute -bottom-1 -right-1',
    'bottom-left': 'absolute -bottom-1 -left-1',
    'inline': 'relative'
  }

  // Variant classes
  const variantClasses = {
    default: 'bg-gradient-to-r from-retro-pink to-retro-purple',
    pulse: 'bg-gradient-to-r from-retro-pink to-retro-purple ',
    glow: 'bg-gradient-to-r from-retro-pink to-retro-purple shadow-lg shadow-retro-pink/50'
  }

  // Animation classes
  const animationClasses = isAnimating 
    ? ' scale-110' 
    : 'scale-100'

  return (
    <div className={`
      ${sizeClasses[size]}
      ${positionClasses[position]}
      ${variantClasses[variant]}
      ${animationClasses}
      ${className}
      rounded-full
      flex items-center justify-center
      text-white font-bold
      
      z-10
    `}>
      {displayCount}
      
      {/* Pulse ring for new notifications */}
      {variant === 'pulse' && count > 0 && (
        <div className="absolute inset-0 rounded-full bg-retro-pink  opacity-75"></div>
      )}
      
      {/* Glow effect */}
      {variant === 'glow' && count > 0 && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-retro-pink to-retro-purple blur-sm opacity-60 "></div>
      )}
    </div>
  )
}