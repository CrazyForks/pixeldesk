'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface PostcardSwapConfirmModalProps {
    isVisible: boolean
    targetName: string
    onConfirm: () => Promise<void>
    onCancel: () => void
}

export default function PostcardSwapConfirmModal({
    isVisible,
    targetName,
    onConfirm,
    onCancel
}: PostcardSwapConfirmModalProps) {
    const { t } = useTranslation()
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        if (!isVisible) {
            setIsProcessing(false)
        }
    }, [isVisible])

    const handleConfirm = async () => {
        setIsProcessing(true)
        try {
            await onConfirm()
        } catch (error) {
            console.error('Swap request failed:', error)
        } finally {
            setIsProcessing(false) // Component might unmount before this, but safe enough
        }
    }

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#eaf4f4] border-4 border-cyan-900/20 rounded-2xl shadow-2xl overflow-hidden p-8 font-sans"
                    >
                        {/* 装饰元素 */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <span className="text-9xl">🕊️</span>
                        </div>

                        <div className="text-center mb-8 relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-900 text-white font-bold mb-6 rounded-full shadow-lg transform -rotate-1">
                                <span className="text-lg">🔁</span>
                                <span>{t.postcard?.swap_confirm || 'Confirm Swap'}</span>
                            </div>

                            <h3 className="text-cyan-950 text-xl font-bold leading-tight mb-4 tracking-tight">
                                {t.postcard?.swap_confirm_desc ?
                                    t.postcard.swap_confirm_desc.replace('{name}', targetName) :
                                    `Send a swap request to ${targetName}?`
                                }
                            </h3>

                            <p className="text-cyan-800/60 text-sm leading-relaxed max-w-sm mx-auto">
                                {t.postcard?.about_intro_desc ?
                                    t.postcard.about_intro_desc.split('。')[1] + '。' :
                                    'When you exchange postcards with other players, they will receive a beautiful snapshot of your current design.'
                                }
                            </p>
                        </div>

                        <div className="flex gap-4 relative z-10">
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t.postcard?.sending || 'Sending...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📨</span>
                                        <span>{t.postcard?.confirm_send || 'Confirm Send'}</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onCancel}
                                disabled={isProcessing}
                                className="flex-1 bg-white hover:bg-gray-50 text-cyan-900 font-bold py-4 rounded-xl border-2 border-cyan-900/10 hover:border-cyan-900/30 shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                                {t.common?.cancel || 'Cancel'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
