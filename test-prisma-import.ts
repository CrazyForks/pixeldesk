import { prisma } from './lib/db'

console.log('Prisma imported:', Boolean(prisma))
console.log('Prisma type:', typeof prisma)

if (prisma && prisma.admin) {
  console.log('Has admin model:', !!prisma.admin)
  console.log('Has findUnique:', typeof prisma.admin.findUnique)
} else {
  console.error('Prisma admin is undefined')
}

process.exit(0)
