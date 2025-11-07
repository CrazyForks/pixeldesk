import { AdminRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * 权限矩阵
 */
export const PERMISSIONS = {
  SUPER_ADMIN: ['*'], // 所有权限
  ADMIN: [
    'players.view',
    'players.edit',
    'characters.view',
    'characters.create',
    'characters.edit',
    'characters.delete',
    'workstations.view',
    'workstations.edit',
    'dashboard.view',
  ],
  VIEWER: [
    'players.view',
    'characters.view',
    'workstations.view',
    'dashboard.view',
  ],
} as const

/**
 * 检查管理员是否有特定权限
 */
export function hasPermission(role: AdminRole, permission: string): boolean {
  const userPermissions = PERMISSIONS[role] || []

  // SUPER_ADMIN 有所有权限
  if (userPermissions.includes('*')) {
    return true
  }

  return userPermissions.includes(permission)
}

/**
 * 检查当前登录的管理员是否有特定权限
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin || !session.user.adminRole) {
    return false
  }

  return hasPermission(session.user.adminRole as AdminRole, permission)
}

/**
 * 要求管理员权限（用于 API 路由）
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return {
    id: session.user.id,
    role: session.user.adminRole as AdminRole,
  }
}

/**
 * 要求特定权限（用于 API 路由）
 */
export async function requirePermission(permission: string) {
  const admin = await requireAdmin()

  if (!hasPermission(admin.role, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`)
  }

  return admin
}
