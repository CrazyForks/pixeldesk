import { prisma } from '../lib/db'
import redis from '../lib/redis'

export default async function TestDB() {
  try {
    console.log('🔍 Starting database connection test...')
    
    // Test PostgreSQL connection
    console.log('📊 Testing PostgreSQL connection...')
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log('✅ PostgreSQL connected successfully:', result)

    // Test Redis connection
    console.log('🔥 Testing Redis connection...')
    await redis.set('test_key', 'connection_success')
    const redisResult = await redis.get('test_key')
    console.log('✅ Redis connected successfully:', redisResult)

    // Test database tables
    console.log('📋 Testing database tables...')
    const userCount = await prisma.user.count()
    const statusCount = await prisma.statusHistory.count()
    const workstationCount = await prisma.workstation.count()
    
    console.log('📊 Database Statistics:')
    console.log(`   👥 Users: ${userCount}`)
    console.log(`   📝 Status History: ${statusCount}`)
    console.log(`   🏢 Workstations: ${workstationCount}`)

    return {
      success: true,
      message: 'Database connection successful',
      stats: {
        users: userCount,
        statusHistory: statusCount,
        workstations: workstationCount
      }
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return {
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Auto-run if this file is executed directly
if (require.main === module) {
  TestDB().then((result) => {
    console.log('\n🎯 Test Result:', result)
    process.exit(result.success ? 0 : 1)
  })
}