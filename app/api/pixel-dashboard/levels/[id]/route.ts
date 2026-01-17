import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/pixel-dashboard/permissions'
import prisma from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission('settings.edit')

        await (prisma.level_definitions as any).delete({
            where: { id: params.id }
        })

        return NextResponse.json({
            success: true,
            message: '等级定义已成功删除',
        })
    } catch (error) {
        console.error('Failed to delete level:', error)
        return NextResponse.json(
            { error: '删除等级失败' },
            { status: 500 }
        )
    }
}
