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

interface LevelProgressProps {
    userId?: string;
    level?: number;
    bits?: number;
    lastNotifiedLevel?: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
    userId,
    level = 0,
    bits = 0,
    lastNotifiedLevel = 0
}) => {
    const { locale } = useTranslation();
    const [data, setData] = useState<UserLevelData | null>(null);
    const [loading, setLoading] = useState(true);

    const lastTriggeredLevelRef = useRef<number | null>(null);

    // Fetch static level definitions once or use a shared hook
    // But for simplicity in this refactor, we still fetch the metadata (names/configs)
    // based on the provided level/bits to keep the UI rich.
    useEffect(() => {
        if (!userId) return;

        const fetchMetadata = async () => {
            try {
                const res = await fetch(`/api/user/level?userId=${userId}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success) {
                        setData(json.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch level metadata", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [userId, level, bits]); // Re-fetch metadata if level/bits change to ensure names/next-level info are correct

    // Level Up Trigger Logic
    useEffect(() => {
        if (!userId || level === undefined || lastNotifiedLevel === undefined) return;

        // Condition: Level is higher than notified level AND hasn't been triggered in this session
        const isNewLevel = level > lastNotifiedLevel;
        const sessionAlreadyTriggered = lastTriggeredLevelRef.current === level;

        if (isNewLevel && !sessionAlreadyTriggered) {
            console.log('🎉 [LevelProgress] Props-based level up detected:', level);
            lastTriggeredLevelRef.current = level;

            // Small delay to let the page settle
            const timer = setTimeout(() => {
                const event = new CustomEvent('level-up', {
                    detail: {
                        userId: userId,
                        newLevel: level,
                        levelName: data?.current.name || `Level ${level}`,
                        rewards: data?.current.config ? ['New Status Badge', 'Access to Vip Areas'] : []
                    }
                });
                window.dispatchEvent(event);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [userId, level, lastNotifiedLevel, data]);

    if (loading || !data) return (
        <div className="w-full bg-white/5 border border-white/5 rounded-xl p-3.5 animate-pulse h-[120px]"></div>
    );

    const { current, next } = data;
    // Use props if they are newer than data (usually they should be in sync)
    const displayLevel = level || current.level;
    const displayBits = bits !== undefined ? bits : current.bits;

    const progressPercent = next ? next.progress : 100;
    const accentColor = current.config?.color || '#3b82f6';

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
                        <LevelBadge level={displayLevel} size="md" />
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
                                {displayBits.toLocaleString()} 累积比特
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{next.requiredBits - displayBits}</span> <span className="opacity-50">升级所需</span>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </div>
        </div>
    );
};
