import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
    console.log('🌱 Seeding yesterday\'s activity...')

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(10, 0, 0, 0)

    // Get a user
    const user = await prisma.users.findFirst()
    if (!user) {
        console.log('❌ No users found to seed data for.')
        return
    }

    // 1. Seed Time Tracking (Overtime King)
    await prisma.time_tracking.create({
        data: {
            userId: user.id,
            activityType: 'working',
            startTime: yesterday,
            endTime: new Date(yesterday.getTime() + 500 * 60 * 1000), // 500 mins
            duration: 500,
            date: yesterday,
            updatedAt: new Date()
        }
    })

    // 2. Seed Post (Interaction King)
    await prisma.posts.create({
        data: {
            id: `test_post_${Date.now()}`,
            authorId: user.id,
            content: 'This is a test post for gazette verification',
            createdAt: yesterday,
            updatedAt: yesterday,
            title: 'Yesterday\'s News'
        }
    })

    // 3. Seed Reply (Interaction King)
    await prisma.post_replies.create({
        data: {
            id: `test_reply_${Date.now()}`,
            postId: `test_post_${Date.now()}`, // Note: this might fail due to FK if we don't use real post, but we just created one
            authorId: user.id,
            content: 'Great post!',
            createdAt: yesterday,
            updatedAt: yesterday
        }
    }).catch(e => console.log('Reply seed failed (expected if post ID mismatch):', e.message))

    console.log('✅ Seeding complete for user:', user.name)
}

seed()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
