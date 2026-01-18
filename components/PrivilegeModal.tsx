"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLevelPermission } from '@/lib/hooks/useLevelPermission';
import { LevelBadge } from './LevelBadge';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface PrivilegeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrivilegeModal({ isOpen, onClose }: PrivilegeModalProps) {
    const { levels, currentUserLevel, loading } = useLevelPermission();
    const { locale } = useTranslation();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-2xl bg-[#1a1a2e] flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                        style={{
                            boxShadow: `
                                -8px 0 0 0 #000,
                                8px 0 0 0 #000,
                                0 -8px 0 0 #000,
                                0 8px 0 0 #000,
                                inset -4px -4px 0 0 rgba(0,0,0,0.5),
                                inset 4px 4px 0 0 rgba(255,255,255,0.05)
                            `
                        }}
                    >
                        {/* Header */}
                        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-[#242442]">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic pixel-font">
                                    Resolution Hierarchy
                                </h2>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">进化等级与权限对照表</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border-2 border-black"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300">
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="w-8 h-8 border-4 border-slate-600 border-t-indigo-500 animate-spin"></div>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {levels.slice().sort((a: any, b: any) => a.level - b.level).map((lvl: any) => {
                                        const isUnlocked = currentUserLevel >= lvl.level;
                                        const isCurrent = currentUserLevel === lvl.level;

                                        return (
                                            <div
                                                key={lvl.level}
                                                className={`relative p-5 transition-all duration-300 ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}
                                                style={{
                                                    backgroundColor: isCurrent ? '#2d2d5a' : isUnlocked ? '#1e1e3a' : '#0f0f1a',
                                                    boxShadow: `
                                                        -4px 0 0 0 #000,
                                                        4px 0 0 0 #000,
                                                        0 -4px 0 0 #000,
                                                        0 4px 0 0 #000,
                                                        inset 2px 2px 0 0 ${isCurrent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
                                                    `
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <LevelBadge level={lvl.level} size="md" />
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="text-[14px] font-black text-white uppercase italic pixel-font">
                                                                    {lvl.name.includes('(')
                                                                        ? (locale === 'zh-CN' ? lvl.name.split('(')[0].trim() : lvl.name.split('(')[1].replace(')', '').trim())
                                                                        : lvl.name
                                                                    }
                                                                </h4>
                                                                {isCurrent && (
                                                                    <span className="px-2 py-0.5 bg-yellow-500 text-[8px] font-black text-black uppercase tracking-widest leading-none shadow-[2px_2px_0_0_#000]">
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-mono mt-1">REQ: {lvl.minBits} BITS</p>
                                                        </div>
                                                    </div>
                                                    {!isUnlocked && (
                                                        <div className="text-slate-600">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {lvl.unlockedFeatures.length > 0 ? (
                                                        lvl.unlockedFeatures.map((feat: string) => (
                                                            <span
                                                                key={feat}
                                                                className={`px-2 py-1 text-[9px] font-black uppercase transition-colors shadow-[2px_2px_0_0_#000] ${isUnlocked
                                                                    ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-500/30'
                                                                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                                                                    }`}
                                                            >
                                                                {feat.replace(/_/g, ' ')}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600 italic">No special privileges</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t-2 border-black bg-[#0f0f1a] flex justify-center">
                            <button
                                onClick={onClose}
                                className="px-10 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs pixel-font shadow-[4px_4px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                CLOSE
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
