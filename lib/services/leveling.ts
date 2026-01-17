import prisma from '@/lib/db'

export type BitSource = 'walk' | 'post_create' | 'blog_create' | 'comment_create' | 'like_give' | 'like_receive' | 'online_time' | 'check_in' | 'system' | 'postcard_exchange' | 'workstation_rent' | 'character_upload' | 'unknown'

// 定义不同行为的经验值配置 (可以后续移入数据库配置)
export const BIT_REWARDS: Record<string, number> = {
    'walk_100': 1,
    'online_10min': 5,
    'post_create': 10,
    'blog_create': 50,
    'like_give': 2,
    'like_receive': 5,
    'comment_create': 5,
    'check_in': 20,
    'postcard_exchange': 15,
    'workstation_rent': 20,
    'character_upload': 30
}

/**
 * 核心升级服务
 */
export const LevelingService = {
    /**
     * 增加 Bits (经验值)
     * 包含防刷逻辑和升级检测
     */
    async addBits(userId: string, amount: number, sourceType: BitSource, sourceId?: string) {
        if (amount <= 0) return null

        try {
            // 1. 记录流水 (Transaction)
            await (prisma as any).bits_history.create({
                data: {
                    userId,
                    amount,
                    sourceType,
                    sourceId,
                    balance: 0 // Will be updated or mostly for log
                }
            })

            // 2. 更新用户总 Bits
            const user = await (prisma as any).users.update({
                where: { id: userId },
                data: {
                    bits: { increment: amount }
                },
                select: { id: true, bits: true, level: true }
            })

            // 3. 检查是否升级
            const u = user as any;
            return await this.checkLevelUp(u.id, u.bits, u.level)
        } catch (error) {
            console.error('Error adding bits:', error)
            return null
        }
    },

    /**
     * 检测是否满足升级条件
     */
    async checkLevelUp(userId: string, currentBits: number, currentLevel: number) {
        // 获取所有等级定义，按等级从高到低排序
        const allLevels = await (prisma as any).level_definitions.findMany({
            orderBy: { level: 'desc' }
        })

        // 找到当前 Bits 满足的最高等级
        const targetLevelConfig = (allLevels as any[]).find((l: any) => currentBits >= l.minBits)

        if (!targetLevelConfig) return { leveledUp: false, currentLevel }

        const targetLevel = targetLevelConfig.level

        // 如果目标等级比当前等级高，执行升级
        if (targetLevel > currentLevel) {
            await (prisma as any).users.update({
                where: { id: userId },
                data: { level: targetLevel }
            })

            return {
                leveledUp: true,
                oldLevel: currentLevel,
                newLevel: targetLevel,
                config: targetLevelConfig
            }
        }

        return { leveledUp: false, currentLevel }
    },

    /**
     * 获取用户当前等级详情和下一级进度
     */
    async getUserLevelProgress(userId: string) {
        const user = await (prisma as any).users.findUnique({
            where: { id: userId },
            select: { bits: true, level: true }
        })

        if (!user) return null
        const u = user as any;
        const currentConfig = await (prisma as any).level_definitions.findUnique({
            where: { level: u.level }
        }) || { name: 'Unknown', visualConfig: {} }

        // 找下一级
        const nextLevel = await (prisma as any).level_definitions.findFirst({
            where: { minBits: { gt: u.bits } },
            orderBy: { minBits: 'asc' }
        })

        return {
            current: {
                level: u.level,
                bits: u.bits,
                name: currentConfig.name,
                config: currentConfig.visualConfig
            },
            next: nextLevel ? {
                level: nextLevel.level,
                requiredBits: nextLevel.minBits,
                progress: Math.min(100, Math.floor((u.bits / nextLevel.minBits) * 100))
            } : null // Max level
        }
    },

    /**
     * 检查用户是否拥有某项权限
     */
    async checkPermission(userId: string, featureKey: string): Promise<boolean> {
        const user = await (prisma as any).users.findUnique({
            where: { id: userId },
            select: { level: true }
        })

        if (!user) return false

        // 获取当前等级及以下所有等级的解锁列表
        const u = user as any;
        const relevantLevels = await (prisma as any).level_definitions.findMany({
            where: { level: { lte: u.level } },
            select: { unlockedFeatures: true }
        })

        const allFeatures = new Set<string>()
        relevantLevels.forEach((l: any) => {
            const features = (l.unlockedFeatures as string[]) || []
            features.forEach((f: any) => allFeatures.add(f))
        })

        return allFeatures.has(featureKey)
    },

    /**
     * 手动同步用户等级 (通常在 Bits 被手动修改后调用)
     */
    async syncUserLevel(userId: string) {
        const user = await (prisma as any).users.findUnique({
            where: { id: userId },
            select: { bits: true, level: true }
        })
        if (!user) return null
        const u = user as any
        return await this.checkLevelUp(userId, u.bits, u.level)
    }
}
