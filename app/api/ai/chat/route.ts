
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuthFromRequest } from '@/lib/serverAuth'
import { getSystemContext } from '@/lib/ai/context'
import { callAiProvider } from '@/lib/ai/adapter'

const DAILY_LIMIT = 20 // 提高到20次

export async function POST(request: NextRequest) {
    try {
        // 1. 验证用户身份 - 使用系统统一的验证方法
        const authResult = await verifyAuthFromRequest(request)
        if (!authResult.success || !authResult.user) {
            console.warn('⚠️ [AI Chat] 身份验证失败:', authResult.error);
            return NextResponse.json({ error: 'Unauthorized', details: authResult.error }, { status: 401 })
        }

        const userId = authResult.user.id;

        // 2. 解析正文
        const body = await request.json()
        const { message, npcId } = body

        if (!message || !npcId) {
            return NextResponse.json({ error: '消息或NPC ID缺失' }, { status: 400 })
        }

        // 3. 准备数据：NPC 信息、全局 AI 配置、系统实时上下文
        const [npc, aiConfig, systemContext] = await Promise.all([
            prisma.aiNpc.findUnique({ where: { id: npcId } }),
            prisma.aiGlobalConfig.findFirst({ where: { isActive: true } }),
            getSystemContext()
        ])

        if (!npc) {
            return NextResponse.json({ error: '找不到该 NPC' }, { status: 404 })
        }

        // 如果没有配置 AI Provider，回退到模拟
        if (!aiConfig || !aiConfig.apiKey) {
            console.warn('⚠️ [AI Chat] 未配置 AI API Key，回退到模拟模式');
            return NextResponse.json({
                success: true,
                reply: `(系统提示: 未配置 AI API Key)\n[${npc.name}]: ${message}？这个我得查查...要不你先去那边转转？`,
                usage: { current: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT }
            })
        }

        // 4. 限制检查
        const today = new Date().toISOString().split('T')[0]
        const usage = await prisma.aiUsage.upsert({
            where: { userId_date: { userId, date: today } },
            update: { count: { increment: 1 } },
            create: { userId, date: today, count: 1 }
        })

        if (usage.count > DAILY_LIMIT) {
            return NextResponse.json({
                success: false,
                reply: `[${npc.name}]: 对不起，我今天聊得太久了，头有点晕...咱们明天再聊吧！`,
                error: 'Limit exceeded'
            }, { status: 429 })
        }

        // 5. 构建 Prompt
        const systemPrompt = `
你现在扮演 PixelDesk 虚拟办公室里的一个角色。
你的名字: ${npc.name}
你的职业/角色: ${npc.role || '工作人员'}
你的性格描述: ${npc.personality}
${npc.knowledge ? `背景知识: ${npc.knowledge}` : ''}

当前办公室实时状态:
- 当前时间: ${systemContext?.time}
- 在线人数: ${systemContext?.onlineCount} 人 (包含: ${systemContext?.onlineSample})
- 工位情况: ${systemContext?.workstationStats}
- 办公室动态: 
${systemContext?.latestBuzz}

指令:
1. 请保持你的角色设定。
2. 回答要简短有力，符合像素游戏风格（通常1-3句话）。
3. 如果被问到办公室的情况，可以利用上面的实时状态信息。
4. 你只有只读权限，不能帮用户修改数据。
5. 请用中文回答。
`.trim();

        // 6. 调用 AI
        try {
            console.log(`🤖 [AI Chat] Calling Provider: ${aiConfig.provider}, Model: ${aiConfig.modelName || 'gemini-1.5-flash'}, BaseURL: ${aiConfig.baseUrl || 'default'}`);

            const reply = await callAiProvider(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                {
                    provider: aiConfig.provider,
                    apiKey: aiConfig.apiKey,
                    modelName: aiConfig.modelName || (aiConfig.provider === 'deepseek' ? 'deepseek-chat' : 'gemini-1.5-flash'),
                    temperature: aiConfig.temperature,
                    baseUrl: aiConfig.baseUrl || undefined
                }
            )

            return NextResponse.json({
                success: true,
                reply: reply,
                usage: {
                    current: usage.count,
                    limit: DAILY_LIMIT,
                    remaining: Math.max(0, DAILY_LIMIT - usage.count)
                }
            })
        } catch (aiError: any) {
            console.error('❌ [AI API ERROR]:', aiError);
            return NextResponse.json({
                success: false,
                reply: `[${npc.name}]: (捂住脑袋) 哎呀，信号好像不太好，我没听清...`,
                error: aiError.message
            })
        }

    } catch (error) {
        console.error('AI Chat Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
