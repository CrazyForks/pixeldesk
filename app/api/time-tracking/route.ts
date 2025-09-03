import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import { TimeTrackingManager } from '../../../lib/timeTracking'

// 创建时间跟踪管理器实例，传入 prisma 客户端
const timeTrackingManager = new TimeTrackingManager(prisma)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, activityType, workstationId, notes } = body

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID是必需的' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: '操作类型是必需的 (start/end)' },
        { status: 400 }
      )
    }

    let result
    
    if (action === 'start') {
      if (!activityType) {
        return NextResponse.json(
          { error: '开始活动时需要指定活动类型' },
          { status: 400 }
        )
      }
      
      result = await timeTrackingManager.startActivity(userId, activityType, workstationId, notes)
    } else if (action === 'end') {
      result = await timeTrackingManager.endActivity(userId)
    } else {
      return NextResponse.json(
        { error: '无效的操作类型，请使用 start 或 end' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('时间跟踪API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const days = parseInt(searchParams.get('days') || '7')

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID是必需的' },
        { status: 400 }
      )
    }

    let result
    
    switch (type) {
      case 'today':
        result = await timeTrackingManager.getTodayStats(userId)
        break
      case 'overview':
        result = await timeTrackingManager.getTimeOverview(userId, days)
        break
      case 'sessions':
        const limit = parseInt(searchParams.get('limit') || '30')
        result = await timeTrackingManager.getWorkSessions(userId, limit)
        break
      case 'current':
        result = await timeTrackingManager.getOngoingActivity(userId)
        break
      default:
        return NextResponse.json(
          { error: '无效的查询类型，请使用 today/overview/sessions/current' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('时间跟踪查询API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}