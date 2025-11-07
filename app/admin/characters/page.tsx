'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Character {
  id: string
  name: string
  displayName: string
  description: string | null
  imageUrl: string
  price: number
  isDefault: boolean
  isActive: boolean
  isCompactFormat: boolean
  sortOrder: number
  userCount: number
  purchaseCount: number
  createdAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function CharactersPage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async (page = 1, searchTerm = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/admin/characters?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCharacters(data.data)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch characters')
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchCharacters(1, search)
  }

  if (loading && !characters.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">角色形象管理</h1>
            <p className="text-gray-400">
              共 {pagination?.total || 0} 个角色形象
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/characters/create')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
          >
            ➕ 创建新角色
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-lg border border-gray-800">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索角色名称..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
          >
            🔍 搜索
          </button>
          <div className="flex gap-2 border-l border-gray-700 pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'} transition-all`}
            >
              📱
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'} transition-all`}
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* Characters Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <div
              key={character.id}
              className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-purple-500 transition-all cursor-pointer"
              onClick={() => router.push(`/admin/characters/${character.id}`)}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-800 flex items-center justify-center p-4 relative">
                <Image
                  src={character.imageUrl}
                  alt={character.displayName}
                  width={192}
                  height={character.isCompactFormat ? 96 : 192}
                  className="object-contain pixelated"
                />
                {character.isDefault && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                    默认
                  </div>
                )}
                {!character.isActive && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    禁用
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold mb-1">
                  {character.displayName}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {character.name}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                    {character.isCompactFormat ? '紧凑格式' : '标准格式'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                    {character.price === 0 ? '免费' : `${character.price} 积分`}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>👥 {character.userCount} 人使用</span>
                  {character.purchaseCount > 0 && (
                    <span>🛒 {character.purchaseCount} 次购买</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  预览
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  标识
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  格式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  使用人数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {characters.map((character) => (
                <tr
                  key={character.id}
                  className="hover:bg-gray-800 cursor-pointer transition-all"
                  onClick={() => router.push(`/admin/characters/${character.id}`)}
                >
                  <td className="px-6 py-4">
                    <Image
                      src={character.imageUrl}
                      alt={character.displayName}
                      width={48}
                      height={character.isCompactFormat ? 24 : 48}
                      className="pixelated"
                    />
                  </td>
                  <td className="px-6 py-4 text-white">{character.displayName}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                    {character.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                      {character.isCompactFormat ? '紧凑' : '标准'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {character.price === 0 ? '免费' : `${character.price} 积分`}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {character.userCount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        character.isActive
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}
                    >
                      {character.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            显示第 {(pagination.page - 1) * pagination.pageSize + 1} 到{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，
            共 {pagination.total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchCharacters(pagination.page - 1)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-white">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page === pagination.totalPages}
              onClick={() => fetchCharacters(pagination.page + 1)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
