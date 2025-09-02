'use client'

import { useState, useCallback, memo } from 'react'

interface WorkstationBindingModalProps {
  isVisible: boolean
  workstation: any
  user: any
  onConfirm: () => Promise<any>
  onCancel: () => void
  onClose: () => void
}

const WorkstationBindingModal = memo(({ 
  isVisible, 
  workstation, 
  user, 
  onConfirm, 
  onCancel,
  onClose 
}: WorkstationBindingModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')

  // 重置状态
  const resetState = useCallback(() => {
    setIsProcessing(false)
    setMessage(null)
    setMessageType('info')
  }, [])

  // 处理确认绑定
  const handleConfirm = useCallback(async () => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setMessage(null)
    
    try {
      // 调用确认回调
      const result = await onConfirm()
      
      if (result.success) {
        setMessageType('success')
        setMessage('绑定成功！')
        
        // 延迟关闭弹窗
        setTimeout(() => {
          onClose()
          resetState()
        }, 1500)
      } else {
        setMessageType('error')
        setMessage(result.error || '绑定失败')
      }
    } catch (error) {
      setMessageType('error')
      setMessage('绑定失败，请重试')
      console.error('绑定失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [onConfirm, onClose, resetState, isProcessing])

  // 处理取消
  const handleCancel = useCallback(() => {
    if (isProcessing) return
    
    onCancel()
    onClose()
    resetState()
  }, [onCancel, onClose, resetState, isProcessing])

  // 处理关闭
  const handleClose = useCallback(() => {
    if (isProcessing) return
    
    onClose()
    resetState()
  }, [onClose, resetState, isProcessing])

  // 如果弹窗不可见，返回null
  if (!isVisible || !workstation || !user) {
    return null
  }

  // 计算用户可用积分
  const userPoints = user.points || user.gold || 0
  const canAfford = userPoints >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 半透明背景 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* 弹窗容器 */}
      <div className="relative bg-gray-900 border border-blue-500/30 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-retro-textMuted hover:text-white transition-colors"
          disabled={isProcessing}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">工位绑定</h2>
          <div className="w-12 h-1 bg-gradient-to-r from-retro-blue to-retro-purple rounded"></div>
        </div>

        {/* 工位信息 */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-retro-textMuted mb-2">工位信息</h3>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-retro-textMuted">工位ID:</span>
                <span className="text-white font-mono">{workstation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-retro-textMuted">位置:</span>
                <span className="text-white">
                  ({Math.floor(workstation.position.x)}, {Math.floor(workstation.position.y)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-retro-textMuted">类型:</span>
                <span className="text-white">{workstation.type}</span>
              </div>
            </div>
          </div>

          {/* 费用信息 */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-retro-textMuted mb-2">费用信息</h3>
            <div className="flex items-center justify-between">
              <span className="text-retro-textMuted">绑定费用:</span>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">5 积分</span>
                <span className="text-gray-500 text-sm">(30天)</span>
              </div>
            </div>
          </div>

          {/* 用户积分 */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-retro-textMuted mb-2">您的积分</h3>
            <div className="flex items-center justify-between">
              <span className="text-retro-textMuted">当前积分:</span>
              <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {userPoints} 积分
              </span>
            </div>
            {!canAfford && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded">
                <p className="text-red-400 text-sm">积分不足，无法绑定此工位</p>
              </div>
            )}
          </div>
        </div>

        {/* 消息显示 */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-green-500/20 border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* 按钮组 */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !canAfford}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
              isProcessing || !canAfford
                ? 'bg-gray-600 text-retro-textMuted cursor-not-allowed'
                : 'bg-gradient-to-r from-retro-blue to-retro-purple hover:from-retro-cyan hover:to-retro-blue text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>处理中...</span>
              </div>
            ) : (
              '确认绑定'
            )}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
              isProcessing
                ? 'bg-gray-600 text-retro-textMuted cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-gray-500'
            }`}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
})

export default WorkstationBindingModal