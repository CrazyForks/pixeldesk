'use client'

import { useEffect, useState } from 'react'
import { LevelBadge } from '@/components/LevelBadge'

interface LevelDefinition {
    id: string
    level: number
    name: string
    minBits: number
    minDays: number
    visualConfig: any
    unlockedFeatures: string[]
}

const DEFAULT_VISUAL_CONFIG = {
    icon: '📦',
    color: '#3b82f6',
}

// Hardcoded for display, should match lib/services/leveling.ts
const BIT_REWARDS_DISPLAY = {
    'Steps (5000)': 1,
    'Daily Active': 5,
    'Create Post': 10,
    'Create Blog': 50,
    'Like Given': 2,
    'Like Received': 5,
    'Comment': 5,
    'Check-in': 20,
    'Exchange Postcard': 15,
    'Rent Workstation': 20,
    'Upload Character': 30
}

const AVAILABLE_FEATURES = [
    'upload_avatar',
    'use_emoji',
    'workstation_diy',
    'title_display',
    'custom_name_color',
    'bgm_setting',
    'trail_effect',
    'interactive_furniture',
    'create_room',
    'global_broadcast',
    'custom_shader',
    'social_image_upload',
    'postcard_exchange',
    'workstation_rent'
]

export default function LevelSettingsPage() {
    const [levels, setLevels] = useState<LevelDefinition[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editingLevel, setEditingLevel] = useState<Partial<LevelDefinition> | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetchLevels()
    }, [])

    const fetchLevels = async () => {
        try {
            const response = await fetch('/api/pixel-dashboard/levels')
            const data = await response.json()
            if (data.success) {
                setLevels(data.data)
            }
        } catch (error) {
            console.error('Error fetching levels:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (level: LevelDefinition | null) => {
        setEditingLevel(level ? { ...level } : {
            level: levels.length,
            name: '',
            minBits: 0,
            minDays: 0,
            visualConfig: { ...DEFAULT_VISUAL_CONFIG },
            unlockedFeatures: []
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        if (!editingLevel) return
        setSaving(true)
        try {
            const response = await fetch('/api/pixel-dashboard/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingLevel)
            })
            const data = await response.json()
            if (data.success) {
                fetchLevels()
                setIsEditing(false)
            } else {
                alert('保存失败: ' + data.error)
            }
        } catch (error) {
            alert('保存出错')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个等级定义吗？')) return
        try {
            const response = await fetch(`/api/pixel-dashboard/levels/${id}`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                fetchLevels()
            }
        } catch (error) {
            alert('删除失败')
        }
    }

    const toggleFeature = (feature: string) => {
        if (!editingLevel) return
        const current = editingLevel.unlockedFeatures || []
        const updated = current.includes(feature)
            ? current.filter(f => f !== feature)
            : [...current, feature]
        setEditingLevel({ ...editingLevel, unlockedFeatures: updated })
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !editingLevel) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('level', (editingLevel.level || 0).toString())

        try {
            const response = await fetch('/api/pixel-dashboard/levels/upload', {
                method: 'POST',
                body: formData
            })
            const data = await response.json()
            if (data.success) {
                setEditingLevel({
                    ...editingLevel,
                    visualConfig: {
                        ...editingLevel.visualConfig,
                        customIcon: data.url
                    }
                })
            } else {
                alert('上传失败')
            }
        } catch (error) {
            alert('上传出错')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-400">加载中...</div>
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">等级配置管理</h1>
                    <p className="text-gray-400 mt-1">配置玩家升级所需的 Bits、视觉样式以及解锁权限。</p>
                </div>
                <button
                    onClick={() => handleEdit(null)}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all shadow-lg"
                >
                    + 添加新等级
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">当前 Bits 获取规则</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {Object.entries(BIT_REWARDS_DISPLAY).map(([key, value]) => (
                            <div key={key} className="bg-black/20 rounded-lg p-3 border border-gray-800">
                                <div className="text-xs text-gray-500 mb-1">{key}</div>
                                <div className="text-lg font-mono text-indigo-400">+{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">等级 (Level)</th>
                            <th className="px-6 py-4">预览</th>
                            <th className="px-6 py-4">等级名称 (Name)</th>
                            <th className="px-6 py-4">所需 Bits</th>
                            <th className="px-6 py-4">需天数</th>
                            <th className="px-6 py-4">已解锁权限</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {levels.map((lvl) => (
                            <tr key={lvl.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-lg text-white">{lvl.level}</td>
                                <td className="px-6 py-4">
                                    <LevelBadge
                                        level={lvl.level}
                                        size="sm"
                                        customColor={lvl.visualConfig?.color}
                                        customIcon={lvl.visualConfig?.customIcon}
                                    />
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-100">{lvl.name}</td>
                                <td className="px-6 py-4 text-indigo-400 font-mono">{lvl.minBits}</td>
                                <td className="px-6 py-4 text-emerald-400 font-mono">{lvl.minDays || 0}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(lvl.unlockedFeatures || []).map(f => (
                                            <span key={f} className="px-2 py-0.5 bg-gray-800 text-[10px] rounded text-gray-400 border border-gray-700">
                                                {f}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => handleEdit(lvl)} className="text-purple-400 hover:text-white transition-colors">编辑</button>
                                        <button onClick={() => handleDelete(lvl.id)} className="text-gray-600 hover:text-red-400 transition-colors">删除</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditing && editingLevel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#1a1b2e] border-2 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-bold text-white">
                                {editingLevel.id ? '编辑等级参数' : '创建新等级'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">等级 (Level ID)</label>
                                    <input
                                        type="number"
                                        value={editingLevel.level}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, level: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">名称 (Resolution Name)</label>
                                    <input
                                        type="text"
                                        value={editingLevel.name}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                                        placeholder="如: 16-BIT DREAMER"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">所需 Bits (Threshold)</label>
                                    <input
                                        type="number"
                                        value={editingLevel.minBits}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, minBits: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">所需天数 (Min Days)</label>
                                    <input
                                        type="number"
                                        value={editingLevel.minDays || 0}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, minDays: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-black/40 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">视觉样式 (Badge Color)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={editingLevel.visualConfig?.color || '#3b82f6'}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                visualConfig: { ...editingLevel.visualConfig, color: e.target.value }
                                            })}
                                            className="w-12 h-10 bg-transparent border-none outline-none cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={editingLevel.visualConfig?.color || '#3b82f6'}
                                            onChange={(e) => setEditingLevel({
                                                ...editingLevel,
                                                visualConfig: { ...editingLevel.visualConfig, color: e.target.value }
                                            })}
                                            className="flex-1 bg-black/40 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">自定义图标 (Custom Icon)</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-black/40 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                                        {editingLevel.visualConfig?.customIcon ? (
                                            <img src={editingLevel.visualConfig.customIcon} className="w-full h-full object-contain pixelated" />
                                        ) : (
                                            <span className="text-2xl opacity-20">🖼️</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            id="icon-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                        <label
                                            htmlFor="icon-upload"
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer text-sm transition-colors"
                                        >
                                            {uploading ? '上传中...' : '选择图片上传'}
                                        </label>
                                        <p className="mt-2 text-xs text-slate-500">上传后将覆盖原有的像素勋章图案。</p>
                                    </div>
                                    {editingLevel.visualConfig?.customIcon && (
                                        <button
                                            onClick={() => setEditingLevel({
                                                ...editingLevel,
                                                visualConfig: { ...editingLevel.visualConfig, customIcon: null }
                                            })}
                                            className="text-xs text-red-400 hover:text-red-300"
                                        >
                                            删除图标
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">解锁权限 (Features)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {AVAILABLE_FEATURES.map(feat => (
                                        <button
                                            key={feat}
                                            onClick={() => toggleFeature(feat)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-bold ${(editingLevel.unlockedFeatures || []).includes(feat)
                                                ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                                : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'
                                                }`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            {feat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/40 p-6 border border-slate-800 rounded-xl space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">徽章预览</h3>
                                <div className="flex items-center gap-6">
                                    <div className="bg-black/40 p-4 rounded-lg flex items-center justify-center border border-slate-800">
                                        <LevelBadge
                                            level={editingLevel.level || 0}
                                            size="md"
                                            customColor={editingLevel.visualConfig?.color}
                                            customIcon={editingLevel.visualConfig?.customIcon}
                                        />
                                    </div>
                                    <div className="text-sm text-slate-400 italic">
                                        勋章会根据设置的颜色和等级实时生成。
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 text-slate-400 hover:text-white font-bold transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-10 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg"
                            >
                                {saving ? '保存中...' : '提交保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
