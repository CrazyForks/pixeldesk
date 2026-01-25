import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface UseImageUploadOptions {
    maxSize?: number // default 500KB in bytes
    maxWidthOrHeight?: number // default 1920
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
    const { maxSize = 500 * 1024, maxWidthOrHeight = 1920 } = options
    const [isUploading, setIsUploading] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [error, setError] = useState('')
    const { t } = useTranslation()

    const compressImage = async (file: File): Promise<File> => {
        // 1. Validate type
        if (!file.type.startsWith('image/')) {
            throw new Error((t.common.upload as any).err_file_type || 'Only image files are allowed')
        }

        // 2. Check if compression is needed
        if (file.size <= maxSize) {
            return file
        }

        try {
            setStatusMessage('Compressing...') // We can expose this if UI wants to show specific status
            console.log(`🖼️ [useImageUpload] Compressing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

            const compressOptions = {
                maxSizeMB: maxSize / (1024 * 1024),
                maxWidthOrHeight,
                useWebWorker: true,
                initialQuality: 0.8
            }

            const compressedFile = await imageCompression(file, compressOptions)
            console.log(`✅ [useImageUpload] Compressed to: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)

            if (compressedFile.size > maxSize) {
                throw new Error(`Image too large after compression (${(compressedFile.size / 1024).toFixed(0)}KB). Please try a smaller image.`)
            }

            return compressedFile
        } catch (err) {
            console.error('Compression failed:', err)
            const msg = err instanceof Error ? err.message : 'Compression failed'
            throw new Error(msg)
        }
    }

    const uploadImage = async (file: File, folder: string = 'uploads'): Promise<string> => {
        setIsUploading(true)
        setError('')
        setStatusMessage((t.common.upload as any).uploading || 'Uploading...')

        try {
            // 1. Compress
            const fileToUpload = await compressImage(file)

            // 2. Upload
            const formData = new FormData()
            formData.append('file', fileToUpload)
            formData.append('folder', folder)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || (t.common.upload as any).err_failed || 'Upload failed')
            }

            return data.url
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed'
            // Parse specific size error if possible or just pass through
            if (msg.includes('too large')) {
                // Try to format it nicely if it matches our custom error? 
                // For now just passing it through is fine as it's readable.
            }
            setError(msg)
            throw err // Re-throw so caller can handle if needed
        } finally {
            setIsUploading(false)
            setStatusMessage('')
        }
    }

    return {
        uploadImage,
        compressImage,
        isUploading,
        statusMessage,
        error,
        setError
    }
}
