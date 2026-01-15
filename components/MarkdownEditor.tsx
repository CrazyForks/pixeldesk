'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

// 动态导入编辑器以避免 SSR 问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
  placeholder?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 500,
  placeholder: propPlaceholder
}: MarkdownEditorProps) {
  const { t } = useTranslation()
  const placeholder = propPlaceholder || t.editor.placeholder
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 禁用游戏键盘输入
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).disableGameKeyboard) {
      (window as any).disableGameKeyboard()
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).enableGameKeyboard) {
        (window as any).enableGameKeyboard()
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div
        className="w-full bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center text-gray-400"
        style={{ height: `${height}px` }}
      >
        {t.editor.loading}
      </div>
    )
  }

  return (
    <div data-color-mode="dark" className="markdown-editor-wrapper">
      <style jsx global>{`
        .markdown-editor-wrapper .w-md-editor {
          background-color: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: none !important;
          display: flex;
          flex-direction: column;
        }
        .markdown-editor-wrapper .w-md-editor-toolbar {
          background-color: rgba(17, 24, 39, 0.6) !important;
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          padding: 8px !important;
        }
        .markdown-editor-wrapper .w-md-editor-content {
          background-color: transparent !important;
        }
        /* 关键修复：确保输入层和预览层行高严格一致 */
        .markdown-editor-wrapper .w-md-editor-text-pre, 
        .markdown-editor-wrapper .w-md-editor-text-input {
          background-color: transparent !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          padding: 20px !important;
        }
        .markdown-editor-wrapper .w-md-editor-text-input {
          caret-color: #06b6d4 !important; /* 青色光标，更容易看清 */
        }
        .markdown-editor-wrapper .w-md-editor-preview {
          background-color: rgba(0, 0, 0, 0.2) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 20px !important;
        }
        .markdown-editor-wrapper .wmde-markdown {
          background-color: transparent !important;
          color: #e5e7eb !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        /* 工具条按钮悬停效果 */
        .markdown-editor-wrapper .w-md-editor-toolbar button {
          color: #9ca3af !important;
          border-radius: 4px !important;
          transition: all 0.2s;
        }
        .markdown-editor-wrapper .w-md-editor-toolbar button:hover {
          color: white !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        preview="live"
        visibleDragbar={false}
        textareaProps={{
          placeholder: placeholder,
          id: 'markdown-textarea'
        }}
        previewOptions={{
          rehypePlugins: [],
        }}
      />
    </div>
  )
}
