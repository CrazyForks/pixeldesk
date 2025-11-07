'use client'

import { useRouter } from 'next/navigation'

export default function CreateCharacterPage() {
  const router = useRouter()

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← 返回
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">创建角色形象</h1>
        <p className="text-gray-400">上传新的角色形象素材</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
        <p className="text-center text-gray-400 py-12">
          该功能正在开发中...
        </p>
      </div>
    </div>
  )
}
