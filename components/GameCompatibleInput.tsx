'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'

interface GameCompatibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const GameCompatibleInput = forwardRef<HTMLInputElement, GameCompatibleInputProps>(
  ({ label, error, helperText, className = '', onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // 合并 refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current)
        } else {
          ref.current = inputRef.current
        }
      }
    }, [ref])

    // 禁用/启用游戏键盘监听 - 使用现有系统
    const disablePhaserKeyboard = () => {
      if (typeof window !== 'undefined' && (window as any).disableGameKeyboard) {
        (window as any).disableGameKeyboard()
      }
    }

    const enablePhaserKeyboard = () => {
      if (typeof window !== 'undefined' && (window as any).enableGameKeyboard) {
        (window as any).enableGameKeyboard()
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      disablePhaserKeyboard()
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      enablePhaserKeyboard()
      onBlur?.(e)
    }

    // 组件卸载时确保重新启用键盘
    useEffect(() => {
      return () => {
        enablePhaserKeyboard()
      }
    }, [])

    const baseInputClasses = `
      w-full px-4 py-3 
      bg-retro-bg-darker 
      border-2 rounded-lg 
      text-white placeholder-retro-textMuted/70
      
      focus:outline-none focus:ring-0
      ${error 
        ? 'border-red-500 focus:border-red-400' 
        : isFocused
        ? 'border-retro-purple focus:border-retro-purple'
        : 'border-retro-border hover:border-retro-border/80'
      }
      ${className}
    `

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-retro-textMuted text-sm font-medium">
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={inputRef}
            className={baseInputClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-input-container="true"
            {...props}
          />
          
          {/* Focus ring effect */}
          {isFocused && (
            <div className="absolute inset-0 rounded-lg ring-2 ring-retro-purple/30 pointer-events-none" />
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm flex items-center space-x-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p className="text-retro-textMuted/70 text-xs">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

GameCompatibleInput.displayName = 'GameCompatibleInput'

export default GameCompatibleInput