
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { getUserIdFromToken } from '@/lib/auth'

const DAILY_LIMIT = 10

export async function POST(request: Request) {
    try {
        // 1. 验证用户身份
        const cookieStore = cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = getUserIdFromToken(token)
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 2. 解析请求参数
        const body = await request.json()
        const { message, npcId } = body

        if (!message || !npcId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        // 3. 验证 NPC 是否存在
        const npc = await prisma.aiNpc.findUnique({
            where: { id: npcId }
        })

        if (!npc) {
            return NextResponse.json({ error: 'NPC not found' }, { status: 404 })
        }

        // 4. 检查并更新每日使用限制 (原子操作)
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

        let usageResult
        try {
            usageResult = await prisma.$transaction(async (tx) => {
                // 查找或创建今日记录
                // 注意：prisma upsert 在高并发下可能有唯一键冲突，但在单个用户场景下通常安全
                // createMany + skipDuplicates 也是一种选择，但这里我们需要返回对象

                let usage = await tx.aiUsage.findUnique({
                    where: { userId_date: { userId, date: today } }
                })

                if (!usage) {
                    usage = await tx.aiUsage.create({
                        data: { userId, date: today, count: 0 }
                    })
                }

                if (usage.count >= DAILY_LIMIT) {
                    throw new Error('LIMIT_EXCEEDED')
                }

                // 增加计数
                const updatedUsage = await tx.aiUsage.update({
                    where: { id: usage.id },
                    data: { count: { increment: 1 } }
                })

                return updatedUsage
            })
        } catch (error: any) {
            if (error.message === 'LIMIT_EXCEEDED') {
                return NextResponse.json({
                    success: false,
                    error: 'Daily limit exceeded',
                    reply: `(${npc.name} 看起来累了，指了指墙上的钟，示意明天再来。)`
                }, { status: 429 })
            }
            throw error
        }

        // 5. 调用 AI 服务 (Phase 1: Mock 响应)
        // Phase 2 将在此处对接 OpenAI/DeepSeek API
        // 模拟思考延迟
        await new Promise(resolve => setTimeout(resolve, 800))

        const mockReply = `[${npc.name}] (模拟回复): 收到！你刚才说 "${message.substring(0, 10)}..." 对吧？很有趣！\n(今日剩余对话: ${DAILY_LIMIT - usageResult.count} 次)`

        return NextResponse.json({
            success: true,
            reply: mockReply,
            usage: {
                current: usageResult.count,
                limit: DAILY_LIMIT,
                remaining: DAILY_LIMIT - usageResult.count
            }
        })

    } catch (error) {
        console.error('AI Chat Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
