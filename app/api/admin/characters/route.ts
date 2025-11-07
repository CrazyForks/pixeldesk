import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/admin/permissions'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 验证权限
    await requirePermission('characters.view')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const isCompactFormat = searchParams.get('isCompactFormat')
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const sortBy = searchParams.get('sortBy') || 'sortOrder'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // 构建查询条件
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (isCompactFormat !== null && isCompactFormat !== undefined && isCompactFormat !== '') {
      where.isCompactFormat = isCompactFormat === 'true'
    }

    if (priceMin !== null && priceMin !== undefined && priceMin !== '') {
      where.price = { ...where.price, gte: parseInt(priceMin) }
    }

    if (priceMax !== null && priceMax !== undefined && priceMax !== '') {
      where.price = { ...where.price, lte: parseInt(priceMax) }
    }

    // 查询数据
    const [characters, total] = await Promise.all([
      prisma.character.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              purchases: true,
            },
          },
        },
      }),
      prisma.character.count({ where }),
    ])

    // 计算每个角色的使用人数（从Player表中统计）
    const charactersWithUsage = await Promise.all(
      characters.map(async (char) => {
        const userCount = await prisma.player.count({
          where: { characterSprite: char.name },
        })

        return {
          ...char,
          userCount,
          purchaseCount: char._count.purchases,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: charactersWithUsage,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Failed to get characters:', error)
    return NextResponse.json(
      { error: '获取角色列表失败' },
      { status: 500 }
    )
  }
}
