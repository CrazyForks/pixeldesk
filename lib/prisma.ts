import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 优化Prisma配置以解决连接池问题和减少日志输出
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // 完全禁用所有日志以减少CPU消耗
  log: [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
  // 注意：__internal API在新版Prisma中可能已废弃，使用环境变量配置连接池
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma