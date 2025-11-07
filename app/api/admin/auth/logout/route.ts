import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // 删除 admin-token cookie
    cookies().delete('admin-token')

    return NextResponse.json({
      success: true,
      message: '已成功登出',
    })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: '登出失败，请重试' },
      { status: 500 }
    )
  }
}
