import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkActivity() {
    console.log('🔍 Checking recent activity...')

    const today = new Date()
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(today.getDate() - 3)

    console.log(`Test Range: ${threeDaysAgo.toISOString()} to ${today.toISOString()}`)

    // Check Time Tracking
    const timeLogs = await prisma.time_tracking.findMany({
        where: {
            startTime: {
                gte: threeDaysAgo
            }
        },
        orderBy: { startTime: 'desc' },
        take: 5
    })

    console.log(`\nFound ${timeLogs.length} time logs in last 3 days:`)
    timeLogs.forEach(log => {
        console.log(`- User: ${log.userId}, Type: ${log.activityType}, Duration: ${log.duration}m, Date: ${log.startTime.toLocaleString()}`)
    })

    // Check Posts
    const posts = await prisma.posts.findMany({
        where: {
            createdAt: {
                gte: threeDaysAgo
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    console.log(`\nFound ${posts.length} posts in last 3 days:`)
    posts.forEach(post => {
        console.log(`- User: ${post.authorId}, Title: ${post.title}, Date: ${post.createdAt.toLocaleString()}`)
    })
}

checkActivity()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
