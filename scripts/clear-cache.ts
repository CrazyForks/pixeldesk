import { redis } from '../lib/redis'

const GAZETTE_CACHE_KEY = 'daily_gazette_v1'

async function clearCache() {
    console.log('🧹 Clearing Gazette Cache...')
    await redis.del(GAZETTE_CACHE_KEY)
    console.log('✅ Cache cleared.')
    process.exit(0)
}

clearCache()
