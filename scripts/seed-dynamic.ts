import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function seed() {
    console.log('🌱 Seeding DYNAMIC activity for "Yesterday"...')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(14, 0, 0, 0) // Set to 2 PM yesterday

    console.log(`Target Date: ${yesterday.toLocaleDateString()}`)

    // Get a user
    const user = await prisma.users.findFirst()
    if (!user) {
        console.log('❌ No users found. Please register a user first.')
        return
    }

    console.log(`Using user: ${user.name} (${user.id})`)

    // 1. Seed Time Tracking (Overtime King)
    // Create a 8-hour work session
    await prisma.time_tracking.create({
        data: {
            userId: user.id,
            activityType: 'working',
            startTime: yesterday,
            endTime: new Date(yesterday.getTime() + 480 * 60 * 1000), // 480 mins = 8 hours
            duration: 480,
            date: yesterday,
            updatedAt: new Date()
        }
    })
    console.log('✅ Created 8-hour work session.')

    // 2. Seed Post (Interaction King)
    const post = await prisma.posts.create({
        data: {
            id: randomUUID(),
            authorId: user.id,
            content: `Reflecting on the productive day of ${yesterday.toLocaleDateString()}`,
            createdAt: yesterday,
            updatedAt: yesterday,
            title: `Daily log: ${yesterday.toLocaleDateString()}`,
            type: 'TEXT'
        }
    })
    console.log('✅ Created a post.')

    // 3. Seed Reply (Interaction King)
    await prisma.post_replies.create({
        data: {
            id: randomUUID(),
            postId: post.id,
            authorId: user.id,
            content: 'Self-replying to boost stats!',
            createdAt: yesterday,
            updatedAt: yesterday
        }
    })
    console.log('✅ Created a reply.')

    console.log('🎉 Seeding complete! "Yesterday\'s Kings" should now be populated.')
    console.log('⚠️ NOTE: You may need to wait up to 12 hours for the cache to expire, OR restart the server to clear the cache immediately.')
}

seed()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
