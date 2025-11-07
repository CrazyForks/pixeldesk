import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { getAdminById } from '@/lib/admin/auth'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('admin-token')

    if (!token) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    // 验证 token
    const decoded = verify(
      token.value,
      process.env.NEXTAUTH_SECRET || 'default-secret'
    ) as { adminId: string }

    // 获取管理员信息
    const admin = await getAdminById(decoded.adminId)
    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: '管理员不存在或已被禁用' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      admin,
    })
  } catch (error) {
    console.error('Get admin info error:', error)
    return NextResponse.json(
      { error: '获取管理员信息失败' },
      { status: 401 }
    )
  }
}
