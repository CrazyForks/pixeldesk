import React, { useEffect, useState, useRef } from 'react';
import { LevelBadge } from './LevelBadge';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface LevelConfig {
    icon?: string;
    color?: string;
    badge?: string;
    cardBg?: string;
}

interface UserLevelData {
    current: {
        level: number;
        bits: number;
        name: string;
        config: LevelConfig;
        lastNotifiedLevel: number;
    };
    next: {
        level: number;
        requiredBits: number;
        progress: number;
    } | null;
}

export const LevelProgress: React.FC<{ userId?: string }> = ({ userId }) => {
    const { locale } = useTranslation();
    const [data, setData] = useState<UserLevelData | null>(null);
    const [loading, setLoading] = useState(true);

    const prevLevelRef = useRef<number | null>(null);
    const initialCheckDoneRef = useRef<boolean>(false);
    const checkDelayActiveRef = useRef<boolean>(true);

    // Poll for level updates - Optimized for performance
    useEffect(() => {
        // Reset level tracking when userId changes to prevent false positives (e.g. Guest -> User transition during load)
        prevLevelRef.current = null;
        initialCheckDoneRef.current = false;
        checkDelayActiveRef.current = true;

        // Start 3-second delay for the initial notification check to avoid interfering with page load
        const delayTimer = setTimeout(() => {
            checkDelayActiveRef.current = false;
            console.log('⏱️ [LevelProgress] 初始检测延迟结束，现在允许触发升级通知');
        }, 3000);

        // Initial fetch
        fetchLevelData();

        const interval = setInterval(() => {
            // Only poll if the document is visible to save CPU
            if (document.visibilityState === 'visible') {
                fetchLevelData();
            }
        }, 300000); // 降低轮询频率到5分钟 (之前是30m过慢，现在统一为5m)

        // 监听手动刷新事件
        const handleRefresh = () => {
            console.log('🔄 [LevelProgress] 收到刷新请求，正在更新等级数据...')
            fetchLevelData();
        };
        window.addEventListener('refresh-user-data', handleRefresh);

        return () => {
            clearInterval(interval);
            clearTimeout(delayTimer);
            window.removeEventListener('refresh-user-data', handleRefresh);
        };
    }, [userId]);

    const fetchLevelData = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/user/level?userId=${userId}`);
            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    const newData = json.data as UserLevelData;
                    setData(newData);

                    // Check for level up
                    // Conditions:
                    // 1. Not in initial 3s delay
                    // 2. Current level is higher than lastNotifiedLevel reported by server
                    // 3. (Optional) current level is higher than prevLevelRef (immediate local check)
                    const isNewLevel = newData.current.level > newData.current.lastNotifiedLevel;

                    if (!checkDelayActiveRef.current && isNewLevel) {
                        // Level Up Detected!
                        console.log('🎉 [LevelProgress] 检测到等级提升:', newData.current.level);
                        const event = new CustomEvent('level-up', {
                            detail: {
                                userId: userId, // 传递 userId 方便后续 API 调用
                                newLevel: newData.current.level,
                                levelName: newData.current.name,
                                rewards: newData.current.config ? ['New Status Badge', 'Access to Vip Areas'] : []
                            }
                        });
                        window.dispatchEvent(event);
                    } else if (isNewLevel) {
                        console.log('🔇 [LevelProgress] 检测到等级高于已通知等级，但处于初始延迟中，暂不弹窗');
                    }

                    prevLevelRef.current = newData.current.level;
                    initialCheckDoneRef.current = true;
                }
            }
        } catch (err) {
            console.error("Failed to fetch level data", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;
    if (!data) return null;

    const { current, next } = data;
    const progressPercent = next ? next.progress : 100;
    const accentColor = current.config?.color || '#3b82f6';

    // Segmented progress bar (8-bit style)
    const segments = 10;
    const activeSegments = Math.round((progressPercent / 100) * segments);

    return (
        <div
            onClick={() => window.dispatchEvent(new CustomEvent('show-privilege-modal'))}
            className="w-full bg-white/5 border border-white/5 rounded-xl p-3.5 cursor-pointer hover:bg-white/10 transition-all group relative overflow-hidden shadow-xl"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative group-hover:scale-110 transition-transform duration-300">
                        <div className="absolute inset-0 bg-indigo-500/20 dark:bg-white/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <LevelBadge level={current.level} size="md" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-[13px] font-bold text-gray-700 dark:text-white tracking-widest uppercase italic font-pixel group-hover:text-indigo-600 dark:group-hover:text-yellow-400 transition-colors">
                                {current.name.includes('(')
                                    ? (locale === 'zh-CN' ? current.name.split('(')[0].trim() : current.name.split('(')[1].replace(')', '').trim())
                                    : current.name
                                }
                            </h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                            <p className="text-[9px] text-gray-400 dark:text-slate-500 font-mono tracking-wider">
                                {current.bits.toLocaleString()} 累积比特
                            </p>
                        </div>
                    </div>
                </div>
                {/* Target level removed as per user request */}
            </div>

            {/* Pixel Experience Bar */}
            <div className="relative">
                <div className="flex gap-[3px] h-3.5">
                    {Array.from({ length: segments }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 relative overflow-hidden bg-white/20 dark:bg-black/60 border border-black/5 dark:border-white/5"
                            style={{
                                boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.05)'
                            }}
                        >
                            {i < activeSegments && (
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: accentColor,
                                        boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.3), inset 0 -1.5px 0 rgba(0,0,0,0.2)'
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {next && (
                <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                            <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700"></span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700"></span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700"></span>
                        </div>
                        <span className="text-[8px] text-gray-400 dark:text-slate-500 font-pixel uppercase tracking-widest">
                            {progressPercent}% 进度
                        </span>
                    </div>
                    <div className="text-[9px] text-gray-400 dark:text-slate-400 font-mono bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{next.requiredBits - current.bits}</span> <span className="opacity-50">升级所需</span>
                    </div>
                </div>
            )}

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </div>
        </div>
    );
};
