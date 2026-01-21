import React from 'react'

/**
 * 渲染带链接的内容，将 URL 替换为 stylized link 文本
 * @param text 原始内容
 * @param viewLinkText 链接显示的文字 (e.g., t.social.view_link)
 * @param className 链接的额外样式
 */
export const renderContentWithUrls = (
    text: string,
    viewLinkText: string = '查看链接',
    className: string = "text-cyan-500 hover:text-cyan-400 transition-colors inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20 mx-0.5"
) => {
    if (!text) return null

    // 1. 先处理 Markdown 链接 [text](url)
    // 使用 split 分割，保留 capture groups
    // Regex: /\[([^\]]+)\]\(([^)]+)\)/g
    const markdownLinkRegex = /(\[[^\]]+\]\([^)]+\))/g
    const parts = text.split(markdownLinkRegex)

    return parts.map((part, index) => {
        // 检查是否是 markdown 链接
        const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (mdMatch) {
            const linkText = mdMatch[1]
            const linkUrl = mdMatch[2]
            return (
                <a
                    key={`md-${index}`}
                    href={linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-400/80 transition-all mx-1 font-medium"
                    onClick={(e) => e.stopPropagation()}
                >
                    {linkText}
                </a>
            )
        }

        // 2. 处理普通文本中的 URL
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const subParts = part.split(urlRegex)

        // 如果 part 本身就是空字符串或其他非 URL 内容，直接 map 回去可能会产生多余结构，稍微处理一下
        return subParts.map((subPart, subIndex) => {
            if (subPart.match(urlRegex)) {
                // 检查是否为图片链接
                if (isImageUrl(subPart)) {
                    // 如果是图片链接，在文本中隐藏（由组件提取并显示）
                    return null
                }

                // 非图片链接：显示简化版 URL
                const displayUrl = subPart.length > 50 ? subPart.substring(0, 47) + '...' : subPart

                return (
                    <a
                        key={`url-${index}-${subIndex}`}
                        href={subPart}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-500 hover:text-cyan-400 hover:underline transition-all mx-0.5 break-all inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="text-[10px]">🔗</span>
                        <span className="text-[11px] font-mono opacity-80">{displayUrl}</span>
                    </a>
                )
            }
            return subPart
        })
    })
}

/**
 * 从文本中提取图片链接
 */
export const extractImageUrls = (text: string): string[] => {
    if (!text) return []
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = text.match(urlRegex) || []

    return matches.filter(url => {
        // 忽略 markdown 链接中的 URL，如果它们被用作链接目标而非直接显示
        // 但这里我们只关心 URL 本身是否是图片
        // TODO: 如果需要排除 [链接文字](图片URL) 这种情况作为"正文图片"展示，可能需要更复杂的解析
        // 目前保持简单：只要是 URL 且是图片格式，就提取
        return isImageUrl(url)
    })
}

/**
 * 检查是否为图片链接
 * 严格模式：只检查扩展名，避免误判普通网页
 */
export const isImageUrl = (url: string): boolean => {
    if (!url) return false
    // 去除 URL 参数（如 ?v=1）再检查扩展名
    const cleanUrl = url.split(/[?#]/)[0].toLowerCase()
    return !!cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|avif|bmg|svg)$/)
}

/**
 * 统一格式化工位 ID 显示
 * @param workstationId 工位 ID (string or number)
 * @returns 格式化后的 3 位 ID 字符串
 */
export const formatWorkstationId = (workstationId: string | number | null | undefined): string => {
    if (workstationId === null || workstationId === undefined) return ''
    const idStr = String(workstationId)
    return idStr.length > 3 ? idStr.substring(0, 3) : idStr
}
