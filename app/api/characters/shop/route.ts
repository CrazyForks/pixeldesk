import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getCharacterImageUrl } from '@/lib/characterUtils'

/**
 * GET /api/characters/shop
 * 获取商店角色列表，标记用户已拥有的角色
 */
export async function GET(request: NextRequest) {
  try {
    // 获取用户信息（可选，未登录也可以查看商店）
    let user = null
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = verifyToken(token)
      if (payload) {
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, points: true }
        })
      }
    }

    // 获取所有激活的角色
    const characters = await prisma.character.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        imageUrl: true,
        frameWidth: true,
        frameHeight: true,
        totalFrames: true,
        isCompactFormat: true,
        price: true,
        isDefault: true,
        sortOrder: true
      }
    })

    // 如果用户已登录，查询用户已拥有的角色
    let ownedCharacterIds: string[] = []
    if (user) {
      const purchases = await prisma.characterPurchase.findMany({
        where: {
          userId: user.id
        },
        select: {
          characterId: true
        }
      })
      ownedCharacterIds = purchases.map(p => p.characterId)
    }

    // 组装响应数据
    const shopCharacters = characters.map(character => ({
      id: character.id,
      name: character.name,
      displayName: character.displayName,
      description: character.description,
      imageUrl: getCharacterImageUrl(character.name),
      frameWidth: character.frameWidth,
      frameHeight: character.frameHeight,
      totalFrames: character.totalFrames,
      isCompactFormat: character.isCompactFormat,
      price: character.price,
      isDefault: character.isDefault,
      isOwned: ownedCharacterIds.includes(character.id) || character.isDefault, // 默认角色视为已拥有
      canPurchase: user ? !ownedCharacterIds.includes(character.id) && !character.isDefault : false
    }))

    return NextResponse.json({
      success: true,
      data: shopCharacters,
      userPoints: user?.points || 0,
      isAuthenticated: !!user
    })
  } catch (error) {
    console.error('获取商店角色列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取角色列表失败' },
      { status: 500 }
    )
  }
}
