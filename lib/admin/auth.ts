import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Admin, AdminRole } from '@prisma/client'

/**
 * 验证管理员密码
 */
export async function verifyAdminPassword(
  username: string,
  password: string
): Promise<Admin | null> {
  const admin = await prisma.admin.findUnique({
    where: { username },
  })

  if (!admin || !admin.isActive) {
    return null
  }

  const isValid = await bcrypt.compare(password, admin.password)
  if (!isValid) {
    return null
  }

  // 更新最后登录时间
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  })

  return admin
}

/**
 * 创建管理员（密码自动加密）
 */
export async function createAdmin(data: {
  username: string
  email: string
  password: string
  role?: AdminRole
}): Promise<Admin> {
  const hashedPassword = await bcrypt.hash(data.password, 10)

  return prisma.admin.create({
    data: {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'ADMIN',
    },
  })
}

/**
 * 修改管理员密码
 */
export async function changeAdminPassword(
  adminId: string,
  newPassword: string
): Promise<Admin> {
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  return prisma.admin.update({
    where: { id: adminId },
    data: { password: hashedPassword },
  })
}

/**
 * 获取管理员信息（不包含密码）
 */
export async function getAdminById(id: string) {
  return prisma.admin.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      isActive: true,
    },
  })
}
