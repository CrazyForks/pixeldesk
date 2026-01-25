import { PrismaClient } from '@prisma/client'

export interface GazetteStats {
    overtimeKing: {
        userId: string
        name: string
        avatar: string | null
        duration: number
    } | null
    interactionKing: {
        userId: string
        name: string
        avatar: string | null
        count: number
    } | null
    date: string
}

export class StatsManager {
    private prisma: PrismaClient

    constructor(prismaClient: PrismaClient) {
        this.prisma = prismaClient
    }

    /**
     * 获取昨天的统计数据（加班王 & 互动王）
     */
    async getYesterdayGazette(): Promise<GazetteStats> {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const dateString = yesterday.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        // 1. 计算加班王 (Overtime King)
        // 统计昨日累计工作时长最长的用户
        const overtimeStats = await this.prisma.time_tracking.groupBy({
            by: ['userId'],
            _sum: {
                duration: true
            },
            where: {
                activityType: 'working',
                startTime: {
                    gte: yesterday,
                    lt: today
                }
            },
            orderBy: {
                _sum: {
                    duration: 'desc'
                }
            },
            take: 1
        })

        let overtimeKing = null
        if (overtimeStats.length > 0 && overtimeStats[0]._sum.duration) {
            const user = await this.prisma.users.findUnique({
                where: { id: overtimeStats[0].userId },
                select: { id: true, name: true, avatar: true, customAvatar: true }
            })
            if (user) {
                overtimeKing = {
                    userId: user.id,
                    name: user.name,
                    avatar: user.customAvatar || user.avatar,
                    duration: overtimeStats[0]._sum.duration
                }
            }
        }

        // 2. 计算互动王 (Interaction King)
        // 统计昨日发帖 + 回复总数最多的用户
        const [postStats, replyStats] = await Promise.all([
            this.prisma.posts.groupBy({
                by: ['authorId'],
                _count: { id: true },
                where: {
                    createdAt: {
                        gte: yesterday,
                        lt: today
                    }
                }
            }),
            this.prisma.post_replies.groupBy({
                by: ['authorId'],
                _count: { id: true },
                where: {
                    createdAt: {
                        gte: yesterday,
                        lt: today
                    }
                }
            })
        ])

        const interactionMap = new Map<string, number>()
        postStats.forEach(s => interactionMap.set(s.authorId, (interactionMap.get(s.authorId) || 0) + s._count.id))
        replyStats.forEach(s => interactionMap.set(s.authorId, (interactionMap.get(s.authorId) || 0) + s._count.id))

        let maxCount = 0
        let interactionKingUserId = null

        interactionMap.forEach((count, userId) => {
            if (count > maxCount) {
                maxCount = count
                interactionKingUserId = userId
            }
        })

        let interactionKing = null
        if (interactionKingUserId) {
            const user = await this.prisma.users.findUnique({
                where: { id: interactionKingUserId },
                select: { id: true, name: true, avatar: true, customAvatar: true }
            })
            if (user) {
                interactionKing = {
                    userId: user.id,
                    name: user.name,
                    avatar: user.customAvatar || user.avatar,
                    count: maxCount
                }
            }
        }

        return {
            overtimeKing,
            interactionKing,
            date: dateString
        }
    }
}
