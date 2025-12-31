
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/ai/npcs - 获取所有活跃的 AI NPC
export async function GET() {
    try {
        const npcs = await prisma.aiNpc.findMany({
            where: { isActive: true }
        })

        if (npcs.length === 0) {
            // 自动创建默认 NPC (如果列表为空)
            // 使用现有的角色资源
            const defaultNpc = await prisma.aiNpc.create({
                data: {
                    name: 'Sarah',
                    sprite: 'Premade_Character_48x48_01', // 使用存在的角色资源
                    x: 5800,
                    y: 750,
                    personality: '你叫 Sarah，是 PixelDesk 像素工位的热情前台接待员。你非常乐于助人，熟悉这里的每一个人。你有点话痨，喜欢聊八卦，但工作很认真。你的目标是让每一位新员工都感到宾至如归。',
                    greeting: '嘿！新来的吗？欢迎来到 PixelDesk！我是 Sarah，有什么不懂的都可以问我哦~'
                }
            })
            console.log('✨ 自动创建初始 AI NPC:', defaultNpc.name)
            return NextResponse.json({ success: true, data: [defaultNpc] })
        }

        return NextResponse.json({ success: true, data: npcs })
    } catch (error) {
        console.error('Error fetching NPCs:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
