import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/pixel-dashboard/permissions'
import prisma from '@/lib/db'

export async function GET() {
    try {
        await requirePermission('settings.view')
        const levels = await (prisma.level_definitions as any).findMany({
            orderBy: { level: 'asc' }
        })
        return NextResponse.json({ success: true, data: levels })
    } catch (error) {
        console.error('Failed to get levels:', error)
        return NextResponse.json({ error: '获取等级列表失败' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requirePermission('settings.edit')
        const body = await request.json()
        const { id, level, name, minBits, visualConfig, unlockedFeatures } = body

        if (id) {
            // Update
            const updated = await (prisma.level_definitions as any).update({
                where: { id },
                data: {
                    level: parseInt(level),
                    name,
                    minBits: parseInt(minBits),
                    visualConfig,
                    unlockedFeatures
                }
            })
            return NextResponse.json({ success: true, data: updated })
        } else {
            // Create
            const created = await (prisma.level_definitions as any).create({
                data: {
                    level: parseInt(level),
                    name,
                    minBits: parseInt(minBits),
                    visualConfig,
                    unlockedFeatures
                }
            })
            return NextResponse.json({ success: true, data: created })
        }
    } catch (error) {
        console.error('Failed to upsert level:', error)
        return NextResponse.json({ error: '保存等级失败' }, { status: 500 })
    }
}
