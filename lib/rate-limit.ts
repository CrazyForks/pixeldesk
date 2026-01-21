import redis from './redis';

/**
 * Rate Limiter using Redis
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
        return {
            success: false,
            count,
            limit,
            remaining: 0,
        };
    }

    // If key doesn't exist, set it with expiration
    if (!current) {
        await redis.set(key, '1', windowSeconds);
    } else {
        // If key exists, increment it
        // Note: Since our redis wrapper doesn't have INCR, we fetch and set.
        // In a high-concurrency production env, we'd use raw Redis INCR for atomicity.
        // For this context, fetch-and-set is acceptable given the current wrapper design.
        await redis.set(key, (count + 1).toString(), windowSeconds);
    }

    return {
        success: true,
        count: count + 1,
        limit,
        remaining: limit - (count + 1),
    };
}

/**
 * Common keys for rate limiting
 */
export const RateLimitKeys = {
    registrationByIp: (ip: string) => `ratelimit:reg:ip:${ip}`,
    registrationByEmail: (email: string) => `ratelimit:reg:email:${email.toLowerCase().trim()}`,
};
