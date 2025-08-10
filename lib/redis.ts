import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('Connected to Redis')
})

// Connect to Redis
redisClient.connect().catch(console.error)

export default redisClient

// Helper functions for common Redis operations
export const redis = {
  // Set a key with expiration
  async set(key: string, value: string, expirationInSeconds?: number) {
    if (expirationInSeconds) {
      return await redisClient.setEx(key, expirationInSeconds, value)
    }
    return await redisClient.set(key, value)
  },

  // Get a key
  async get(key: string) {
    return await redisClient.get(key)
  },

  // Delete a key
  async del(key: string) {
    return await redisClient.del(key)
  },

  // Check if key exists
  async exists(key: string) {
    return await redisClient.exists(key)
  },

  // Set JSON value
  async setJSON(key: string, value: any, expirationInSeconds?: number) {
    const jsonValue = JSON.stringify(value)
    if (expirationInSeconds) {
      return await redisClient.setEx(key, expirationInSeconds, jsonValue)
    }
    return await redisClient.set(key, jsonValue)
  },

  // Get JSON value
  async getJSON(key: string) {
    const value = await redisClient.get(key)
    if (value) {
      return JSON.parse(value)
    }
    return null
  },

  // Close connection
  async quit() {
    return await redisClient.quit()
  }
}