import { useEffect, useCallback } from 'react'

export interface NotificationKeyboardHandlers {
  onMarkAllRead?: () => void
  onClearAll?: () => void
  onTogglePanel?: () => void
  onOpenLatest?: () => void
}

export interface UseNotificationKeyboardOptions {
  enabled?: boolean
  handlers: NotificationKeyboardHandlers
}

export function useNotificationKeyboard({ 
  enabled = true, 
  handlers 
}: UseNotificationKeyboardOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Check for modifier keys (Ctrl/Cmd + Shift for notification shortcuts)
    const isModifierPressed = (event.ctrlKey || event.metaKey) && event.shiftKey

    if (!isModifierPressed) return

    switch (event.key.toLowerCase()) {
      case 'r':
        // Ctrl/Cmd + Shift + R: Mark all notifications as read
        event.preventDefault()
        handlers.onMarkAllRead?.()
        break
        
      case 'c':
        // Ctrl/Cmd + Shift + C: Clear all notifications
        event.preventDefault()
        handlers.onClearAll?.()
        break
        
      case 'n':
        // Ctrl/Cmd + Shift + N: Toggle notification panel
        event.preventDefault()
        handlers.onTogglePanel?.()
        break
        
      case 'o':
        // Ctrl/Cmd + Shift + O: Open latest notification
        event.preventDefault()
        handlers.onOpenLatest?.()
        break
    }
  }, [enabled, handlers])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  // Return keyboard shortcut info for display
  return {
    shortcuts: [
      { key: 'Ctrl/Cmd + Shift + R', description: '标记所有通知为已读' },
      { key: 'Ctrl/Cmd + Shift + C', description: '清空所有通知' },
      { key: 'Ctrl/Cmd + Shift + N', description: '切换通知面板' },
      { key: 'Ctrl/Cmd + Shift + O', description: '打开最新通知' }
    ]
  }
}