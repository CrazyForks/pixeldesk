'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import LoadingSpinner from '@/components/LoadingSpinner'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    maxSize?: number // in bytes
    label?: string
    hint?: string
    className?: string
    aspectRatio?: 'video' | 'square' | 'auto'
}

export default function ImageUpload({
    value,
    onChange,
    maxSize = 1024 * 1024 * 2, // 2MB default
    label,
    hint,
    className = '',
    aspectRatio = 'video'
}: ImageUploadProps) {
    const { t } = useTranslation()
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await uploadFile(file)
    }

    const uploadFile = async (file: File) => {
        if (file.size > maxSize) {
            const sizeKB = Math.round(file.size / 1024)
            const maxMB = Math.round(maxSize / (1024 * 1024))
            setError(
                (t.common.upload as any).err_size_limit
                    .replace('{size}', sizeKB.toString())
                    .replace('{max}', maxMB.toString())
            )
            return
        }

        setIsUploading(true)
        setError('')

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (response.ok && data.success) {
                onChange(data.url)
            } else {
                throw new Error(data.error || (t.common.upload as any).err_failed)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : (t.common.upload as any).err_failed)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            await uploadFile(file)
        }
    }

    const aspectClass = {
        video: 'aspect-video',
        square: 'aspect-square',
        auto: 'aspect-auto'
    }[aspectRatio]

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-400">
                    {label}
                </label>
            )}

            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all
          ${value ? 'border-transparent' : 'border-gray-800 hover:border-cyan-500/50 hover:bg-gray-800/50'}
          ${error ? 'border-red-500/50' : ''}
          ${aspectClass}
        `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <div className="text-white text-sm font-medium flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {(t.common.upload as any).change_image}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onChange('')
                                }}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg transition-colors"
                                title={(t.common.upload as any).delete_image}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-3 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 text-gray-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-400 group-hover:text-gray-300">
                            {(t.common.upload as any).click_or_drag}
                        </p>
                        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                            <span className="text-xs font-medium text-cyan-500">{(t.common.upload as any).uploading}</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs mt-2 animate-shake">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}
        </div>
    )
}
