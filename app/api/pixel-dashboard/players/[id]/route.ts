import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/pixel-dashboard/permissions'
import prisma from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission('players.view')

        const player = await (prisma.players as any).findUnique({
            where: { id: params.id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        points: true,
                        bits: true,
                        level: true,
                        isActive: true,
                        createdAt: true,
                        lastLogin: true,
                    },
                },
            },
        })

        if (!player) {
            return NextResponse.json({ error: '玩家未找到' }, { status: 404 })
        }

        // 格式化输出
        const totalHours = Math.floor(player.totalPlayTime / 60)
        const totalMinutes = player.totalPlayTime % 60

        const formattedPlayer = {
            ...player,
            userName: player.users.name,
            email: player.users.email,
            points: player.users.points,
            bits: player.users.bits,
            level: player.users.level,
            isActive: player.users.isActive,
            totalPlayTimeText: totalHours > 0
                ? `${totalHours}小时${totalMinutes}分钟`
                : `${totalMinutes}分钟`,
        }

        return NextResponse.json({
            success: true,
            data: formattedPlayer,
        })
    } catch (error) {
        console.error('Failed to get player:', error)
        return NextResponse.json(
            { error: '获取玩家详情失败' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission('players.edit')

        const body = await request.json()
        const { bits, points } = body

        const player = await prisma.players.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (!player) {
            return NextResponse.json({ error: '玩家未找到' }, { status: 404 })
        }

        const updateData: any = {}
        if (bits !== undefined) updateData.bits = parseInt(bits)
        if (points !== undefined) updateData.points = parseInt(points)

        const updatedUser = await (prisma.users as any).update({
            where: { id: player.userId },
            data: updateData
        })

        // Check if level needs update
        if (bits !== undefined) {
            const { LevelingService } = await import('@/lib/services/leveling');
            await LevelingService.syncUserLevel(player.userId);
        }

        return NextResponse.json({
            success: true,
            data: updatedUser,
        })
    } catch (error) {
        console.error('Failed to update player:', error)
        return NextResponse.json(
            { error: '更新玩家失败' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requirePermission('players.delete')

        // 查找玩家以获取 userId
        const player = await prisma.players.findUnique({
            where: { id: params.id },
            select: { userId: true }
        })

        if (!player) {
            return NextResponse.json({ error: '玩家未找到' }, { status: 404 })
        }

        // 删除用户（级联删除 Player 记录）
        await prisma.users.delete({
            where: { id: player.userId }
        })

        return NextResponse.json({
            success: true,
            message: '玩家已成功删除',
        })
    } catch (error) {
        console.error('Failed to delete player:', error)
        return NextResponse.json(
            { error: '删除玩家失败' },
            { status: 500 }
        )
    }
}
