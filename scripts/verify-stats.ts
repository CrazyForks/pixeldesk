import { PrismaClient } from '@prisma/client'
import { StatsManager } from '../lib/stats'

const prisma = new PrismaClient()
const statsManager = new StatsManager(prisma)

async function main() {
    console.log('🚀 Starting Stats Verification...')

    try {
        const gazette = await statsManager.getYesterdayGazette()
        console.log('✅ Yesterday\'s Gazette Specs:')
        console.log(JSON.stringify(gazette, null, 2))

        if (!gazette.overtimeKing && !gazette.interactionKing) {
            console.log('⚠️ No kings found for yesterday. (This is normal if the DB is empty or its a fresh install)')
        } else {
            console.log('🎉 Successfully fetched yesterday\'s kings!')
        }

    } catch (error) {
        console.error('❌ Stats Verification Failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
