import { createClient } from 'redis';

// Redis connection status
let redisConnected = false;
let redisClient: any = null;

// Memory cache fallback when Redis is unavailable
const memoryCache = new Map<string, { value: any, expiresAt: number | null }>();

// Try to initialize Redis client
const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.warn('❌ [Redis] Reached maximum reconnect retries. Falling back to memory cache.');
            redisConnected = false;
            return false; // stop retrying
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err: any) => {
      if (!redisConnected) {
        // Only log serious errors if we weren't already aware it's down
        console.error('❌ [Redis] Connection Error:', err.message);
      }
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🚀 [Redis] Connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ [Redis] Connected and ready');
      redisConnected = true;
    });

    // Initial connection attempt
    redisClient.connect().catch((err: any) => {
      console.warn('⚠️ [Redis] Initial connection failed. Using memory cache fallback.');
      redisConnected = false;
    });
  } catch (error) {
    console.error('❌ [Redis] Failed to initialize client:', error);
  }
} else {
  console.warn('⚠️ [Redis] REDIS_URL not found in environment. Using memory cache.');
}

// Internal wrapper to handle fallback logic
const execute = async <T>(
  redisOp: (client: any) => Promise<T>,
  memoryOp: () => T | Promise<T>
): Promise<T> => {
  if (redisConnected && redisClient) {
    try {
      return await redisOp(redisClient);
    } catch (error) {
      console.warn('⚠️ [Redis] Operation failed, falling back to memory:', error);
      redisConnected = false;
      return await memoryOp();
    }
  }
  return await memoryOp();
};

export const redis = {
  // Set a key with optional expiration
  async set(key: string, value: string, expirationInSeconds?: number) {
    return await execute(
      async (client) => {
        if (expirationInSeconds) {
          return await client.setEx(key, expirationInSeconds, value);
        }
        return await client.set(key, value);
      },
      () => {
        memoryCache.set(key, {
          value,
          expiresAt: expirationInSeconds ? Date.now() + expirationInSeconds * 1000 : null
        });
        return 'OK';
      }
    );
  },

  // Get a key
  async get(key: string) {
    return await execute(
      async (client) => await client.get(key),
      () => {
        const item = memoryCache.get(key);
        if (!item) return null;
        if (item.expiresAt && item.expiresAt < Date.now()) {
          memoryCache.delete(key);
          return null;
        }
        return item.value;
      }
    );
  },

  // Delete a key or multiple keys
  async del(key: string | string[]) {
    return await execute(
      async (client) => await client.del(key),
      () => {
        if (Array.isArray(key)) {
          key.forEach(k => memoryCache.delete(k));
          return key.length;
        }
        memoryCache.delete(key);
        return 1;
      }
    );
  },

  // Check if key exists
  async exists(key: string) {
    return await execute(
      async (client) => (await client.exists(key)) === 1,
      () => {
        const item = memoryCache.get(key);
        if (!item) return false;
        if (item.expiresAt && item.expiresAt < Date.now()) {
          memoryCache.delete(key);
          return false;
        }
        return true;
      }
    );
  },

  // Get keys by pattern (Limited support in memory mode)
  async keys(pattern: string) {
    return await execute(
      async (client) => await client.keys(pattern),
      () => {
        // Basic prefix matching for memory cache
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return Array.from(memoryCache.keys()).filter(k => k.startsWith(prefix));
        }
        return [];
      }
    );
  },

  // Set JSON value
  async setJSON(key: string, value: any, expirationInSeconds?: number) {
    const jsonValue = JSON.stringify(value);
    return this.set(key, jsonValue, expirationInSeconds);
  },

  // Get JSON value
  async getJSON(key: string) {
    const value = await this.get(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('❌ [Redis] JSON Parse error:', e);
        return null;
      }
    }
    return null;
  },

  // Close connection
  async quit() {
    if (redisClient) {
      try {
        await redisClient.quit();
        redisConnected = false;
      } catch (e) {
        console.warn('⚠️ [Redis] Quit error:', e);
      }
    }
  }
};

// Default export for compatibility
export default redis;