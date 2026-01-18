import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const minX = searchParams.get('minX')
    const maxX = searchParams.get('maxX')
    const minY = searchParams.get('minY')
    const maxY = searchParams.get('maxY')

    const where: any = {}

    // 如果提供了ID，直接根据ID查询
    if (id) {
      where.id = id
    }
    // 如果提供了所有空间参数，则进行区域查询
    else if (minX && maxX && minY && maxY) {
      where.xPosition = {
        gte: parseFloat(minX),
        lte: parseFloat(maxX)
      }
      where.yPosition = {
        gte: parseFloat(minY),
        lte: parseFloat(maxY)
      }
    }

    // 获取工位 (带筛选)
    const workstations = await prisma.workstations.findMany({
      where,
      // 限制返回数量以防万一，但对于视口查询应该足够安全
      take: 1000
    })

    return NextResponse.json({ success: true, data: workstations })
  } catch (error) {
    console.error('Error fetching workstations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, xPosition, yPosition } = await request.json()

    if (!id || !name || xPosition === undefined || yPosition === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 创建或更新工位
    const workstation = await prisma.workstations.upsert({
      where: { id },
      update: {
        name,
        xPosition,
        yPosition
      },
      create: {
        id,
        name,
        xPosition,
        yPosition
      }
    })

    return NextResponse.json({ success: true, data: workstation })
  } catch (error) {
    console.error('Error creating/updating workstation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}