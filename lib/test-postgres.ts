import { prisma } from '../lib/db'

export default async function TestPostgreSQL() {
  try {
    console.log('🔍 Testing PostgreSQL connection...')
    
    // Test PostgreSQL connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log('✅ PostgreSQL connected successfully:', result)

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
      message: 'PostgreSQL connection successful',
      stats: {
        users: userCount,
        statusHistory: statusCount,
        workstations: workstationCount
      }
    }
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    return {
      success: false,
      message: 'PostgreSQL connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Auto-run if this file is executed directly
if (require.main === module) {
  TestPostgreSQL().then((result) => {
    console.log('\n🎯 Test Result:', result)
    process.exit(result.success ? 0 : 1)
  })
}