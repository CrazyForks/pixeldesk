import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

/**
 * POST /api/characters/purchase
 * 购买角色形象
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '请先登录' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: '无效的认证令牌' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { characterId } = body

    if (!characterId) {
      return NextResponse.json(
        { success: false, error: '缺少角色ID' },
        { status: 400 }
      )
    }

    // 查询角色信息
    const character = await prisma.character.findUnique({
      where: { id: characterId, isActive: true }
    })

    if (!character) {
      return NextResponse.json(
        { success: false, error: '角色不存在或已下架' },
        { status: 404 }
      )
    }

    // 检查是否已拥有
    const existingPurchase = await prisma.characterPurchase.findUnique({
      where: {
        userId_characterId: {
          userId: user.id,
          characterId: characterId
        }
      }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { success: false, error: '您已拥有此角色' },
        { status: 400 }
      )
    }

    // 检查积分是否足够
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { points: true }
    })

    if (!currentUser || currentUser.points < character.price) {
      return NextResponse.json(
        {
          success: false,
          error: '积分不足',
          required: character.price,
          current: currentUser?.points || 0
        },
        { status: 400 }
      )
    }

    // 使用事务完成购买
    const result = await prisma.$transaction(async (tx) => {
      // 扣除积分
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          points: {
            decrement: character.price
          }
        }
      })

      // 创建购买记录
      const purchase = await tx.characterPurchase.create({
        data: {
          userId: user.id,
          characterId: character.id,
          price: character.price
        }
      })

      return {
        purchase,
        remainingPoints: updatedUser.points
      }
    })

    // 发送积分更新事件（客户端监听）
    // 这里可以通过 Server-Sent Events 或 WebSocket 推送，简化起见返回即可

    return NextResponse.json({
      success: true,
      message: `成功购买角色「${character.displayName}」！`,
      data: {
        character: {
          id: character.id,
          name: character.name,
          displayName: character.displayName
        },
        pricePaid: character.price,
        remainingPoints: result.remainingPoints,
        purchasedAt: result.purchase.purchasedAt
      }
    })
  } catch (error) {
    console.error('购买角色失败:', error)
    return NextResponse.json(
      { success: false, error: '购买失败，请重试' },
      { status: 500 }
    )
  }
}
