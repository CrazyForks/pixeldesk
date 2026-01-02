'use client'

import { useState, useEffect } from 'react'

interface LibraryModalProps {
    onClose: () => void
}

interface Book {
    id: string
    title: string
    author: string
    description?: string
    coverUrl?: string
    content?: string
}

const translations = {
    'zh-CN': {
        library: '藏书阁',
        bookcaseId: '书架编号',
        books: '本书',
        emptyShelf: '这个书架空空如也...',
        organizing: '正在整理书架...',
        bookDetails: '书籍详情',
        author: '作者',
        description: '简介',
        content: '内容',
        close: '关闭',
        backToShelf: '返回书架',
        featureInDev: '📚 阅读功能正在精心打磨中',
        featureDesc: '我们正在为您打造更好的阅读体验，敬请期待...',
        noDescription: '暂无简介',
        noContent: '暂无内容'
    },
    'en': {
        library: 'Library',
        bookcaseId: 'Bookcase ID',
        books: 'Books',
        emptyShelf: 'This bookshelf is empty...',
        organizing: 'Organizing bookshelf...',
        bookDetails: 'Book Details',
        author: 'Author',
        description: 'Description',
        content: 'Content',
        close: 'Close',
        backToShelf: 'Back to Shelf',
        featureInDev: '📚 Reading Feature Under Development',
        featureDesc: 'We are crafting a better reading experience for you. Stay tuned...',
        noDescription: 'No description available',
        noContent: 'No content available'
    }
}

export default function LibraryModal({ onClose }: LibraryModalProps) {
    const [bookcaseId, setBookcaseId] = useState<string | null>(null)
    const [books, setBooks] = useState<Book[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedBook, setSelectedBook] = useState<Book | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [language, setLanguage] = useState<'zh-CN' | 'en'>('zh-CN')

    const t = translations[language]

    // Get language from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLang = localStorage.getItem('pixeldesk-language') as 'zh-CN' | 'en'
            if (savedLang) setLanguage(savedLang)
        }
    }, [])

    // Listen for 'open-library' event
    useEffect(() => {
        const handleOpenLibrary = (event: CustomEvent) => {
            const id = event.detail.bookcaseId
            setBookcaseId(id)
            setIsVisible(true)
            setSelectedBook(null)
            fetchBooks(id)
        }

        window.addEventListener('open-library' as any, handleOpenLibrary)

        return () => {
            window.removeEventListener('open-library' as any, handleOpenLibrary)
        }
    }, [])

    // ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                handleClose()
            }
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isVisible])

    // Disable game input when modal is open
    useEffect(() => {
        if (typeof window !== 'undefined' && window.disableGameInput && window.enableGameInput) {
            if (isVisible) {
                window.disableGameInput()
            } else {
                window.enableGameInput()
            }
        }

        return () => {
            if (typeof window !== 'undefined' && window.enableGameInput) {
                window.enableGameInput()
            }
        }
    }, [isVisible])

    const fetchBooks = async (id: string) => {
        setLoading(true)
        try {
            let url = '/api/library/books'
            if (id) {
                url += `?bookcaseId=${id}`
            }
            const res = await fetch(url)
            const data = await res.json()
            if (data.success) {
                setBooks(data.data)
            }
        } catch (error) {
            console.error('Error fetching books:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setIsVisible(false)
        setSelectedBook(null)
        onClose && onClose()
    }

    if (!isVisible) return null

    // Book Detail View
    if (selectedBook) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            >
                <div
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border-8 border-amber-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-amber-900 text-amber-50 px-6 py-4 flex justify-between items-center">
                        <button
                            onClick={() => setSelectedBook(null)}
                            className="text-amber-200 hover:text-white flex items-center gap-2"
                        >
                            ← {t.backToShelf}
                        </button>
                        <button
                            onClick={handleClose}
                            className="bg-amber-800 hover:bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-3xl mx-auto">
                            {/* Book Cover and Info */}
                            <div className="flex gap-8 mb-8">
                                <div className="flex-shrink-0">
                                    {selectedBook.coverUrl ? (
                                        <img
                                            src={selectedBook.coverUrl}
                                            alt={selectedBook.title}
                                            className="w-48 h-64 object-cover rounded-lg shadow-2xl border-4 border-amber-200"
                                        />
                                    ) : (
                                        <div className="w-48 h-64 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg shadow-2xl border-4 border-amber-200 flex items-center justify-center">
                                            <span className="text-6xl">📖</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-4xl font-bold text-amber-900 mb-3">{selectedBook.title}</h1>
                                    <p className="text-xl text-amber-800 mb-6">{t.author}: {selectedBook.author}</p>

                                    {selectedBook.description && (
                                        <div className="bg-amber-100 p-4 rounded-lg border-2 border-amber-200">
                                            <h3 className="font-bold text-amber-900 mb-2">{t.description}</h3>
                                            <p className="text-amber-800 leading-relaxed">{selectedBook.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Feature in Development Notice */}
                            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 rounded-xl p-8 text-center mb-6">
                                <div className="text-3xl mb-3">{t.featureInDev}</div>
                                <p className="text-amber-700 text-lg">{t.featureDesc}</p>
                            </div>

                            {/* Content Preview (if available) */}
                            {selectedBook.content && (
                                <div className="bg-white/50 p-6 rounded-lg border-2 border-amber-200">
                                    <h3 className="font-bold text-amber-900 mb-3 text-xl">{t.content}</h3>
                                    <div className="text-amber-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                                        {selectedBook.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Bookshelf View
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border-8 border-amber-900"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-amber-900 text-amber-50 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            📚 {t.library}
                        </h2>
                        {bookcaseId && (
                            <div className="text-sm text-amber-200 mt-1">
                                {t.bookcaseId}: {bookcaseId}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm bg-amber-800 px-3 py-1 rounded-full">
                            {books.length} {t.books}
                        </span>
                        <button
                            onClick={handleClose}
                            className="bg-amber-800 hover:bg-amber-700 text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-10 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Bookshelf Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="text-center py-20 text-amber-700 text-xl">{t.organizing}</div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-20 text-amber-600 italic text-xl">
                            {t.emptyShelf}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {books.map(book => (
                                <div
                                    key={book.id}
                                    onClick={() => setSelectedBook(book)}
                                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                                >
                                    <div className="relative">
                                        {/* Book Cover */}
                                        {book.coverUrl ? (
                                            <img
                                                src={book.coverUrl}
                                                alt={book.title}
                                                className="w-full h-64 object-cover rounded-lg shadow-lg border-4 border-amber-200 group-hover:border-amber-400 group-hover:shadow-2xl transition-all"
                                            />
                                        ) : (
                                            <div className="w-full h-64 bg-gradient-to-br from-amber-200 to-amber-300 rounded-lg shadow-lg border-4 border-amber-200 group-hover:border-amber-400 group-hover:shadow-2xl transition-all flex items-center justify-center">
                                                <span className="text-6xl">📖</span>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-all" />
                                    </div>

                                    {/* Book Info */}
                                    <div className="mt-3 text-center">
                                        <h3 className="font-bold text-amber-900 text-sm line-clamp-2 group-hover:text-amber-700">
                                            {book.title}
                                        </h3>
                                        <p className="text-xs text-amber-700 mt-1 line-clamp-1">
                                            {book.author}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
