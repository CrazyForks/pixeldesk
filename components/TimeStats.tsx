'use client'

import { useState, useEffect } from 'react'

interface TimeStatsProps {
  userId?: string
}

interface TimeStatsData {
  dailyStats: Record<string, Record<string, number>>
  totalActivities: number
}

interface TodayStatsData {
  activities: any[]
  stats: Record<string, number>
}

export default function TimeStats({ userId }: TimeStatsProps) {
  const [timeStats, setTimeStats] = useState<TimeStatsData | null>(null)
  const [todayStats, setTodayStats] = useState<TodayStatsData | null>(null)
  const [loading, setLoading] = useState(false)

  const loadTimeStats = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // 加载时间概览
      const overviewResponse = await fetch(`/api/time-tracking?userId=${userId}&type=overview&days=7`)
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json()
        setTimeStats(overviewData.data)
      }

      // 加载今日统计
      const todayResponse = await fetch(`/api/time-tracking?userId=${userId}&type=today`)
      if (todayResponse.ok) {
        const todayData = await todayResponse.json()
        setTodayStats(todayData.data)
      }
    } catch (error) {
      console.error('加载时间统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadTimeStats()
    }
  }, [userId])

  if (!userId) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div className="text-center text-retro-textMuted">
          请先登录以查看时间统计
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <div className="text-center text-retro-textMuted">
          加载时间统计中...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 今日统计 */}
      {todayStats && (
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-retro-blue/20 to-retro-purple/20 opacity-0 group-hover:opacity-100 "></div>
          <div className="relative bg-retro-bg-darker/80 backdrop-blur-sm border border-retro-border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">今日时间统计</h3>
              <span className="text-xs text-retro-textMuted">
                {new Date().toLocaleDateString('zh-CN')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(todayStats.stats).map(([activityType, duration]) => (
                <div key={activityType} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">
                    {getActivityLabel(activityType)}
                  </span>
                  <span className="text-white font-medium">
                    {duration} 分钟
                  </span>
                </div>
              ))}
              
              {todayStats.stats.total && (
                <div className="col-span-2 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm font-medium">总计</span>
                    <span className="text-white font-bold">
                      {todayStats.stats.total} 分钟
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7天概览 */}
      {timeStats && (
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-retro-green/20 to-retro-blue/20 opacity-0 group-hover:opacity-100 "></div>
          <div className="relative bg-retro-bg-darker/80 backdrop-blur-sm border border-retro-border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">7天时间概览</h3>
              <span className="text-xs text-retro-textMuted">
                总活动: {timeStats.totalActivities}
              </span>
            </div>
            
            <div className="space-y-3">
              {Object.entries(timeStats.dailyStats)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .slice(0, 5)
                .map(([date, stats]) => (
                  <div key={date} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">
                      {new Date(date).toLocaleDateString('zh-CN')}
                    </span>
                    <span className="text-white font-medium">
                      {stats.total || 0} 分钟
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 刷新按钮 */}
      <button
        onClick={loadTimeStats}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl  border border-white/10 hover:border-white/20"
      >
        刷新统计
      </button>
    </div>
  )
}

function getActivityLabel(activityType: string): string {
  const labels: Record<string, string> = {
    working: '工作时间',
    break: '休息时间',
    reading: '阅读时间',
    restroom: '洗手间',
    meeting: '会议时间',
    lunch: '午餐时间',
    off_work: '下班时间',
    total: '总计'
  }
  return labels[activityType] || activityType
}