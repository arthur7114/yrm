import Redis from 'ioredis'

/**
 * Redis client singleton.
 * Uses the REDIS_URL environment variable.
 */
class RedisClient {
  private static instance: Redis | null = null

  public static getInstance(): Redis {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) {
        throw new Error('REDIS_URL is not configured.')
      }
      this.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })

      this.instance.on('error', (err) => {
        console.error('Redis error:', err)
      })
    }
    return this.instance
  }
}

export const redis = RedisClient.getInstance()

/**
 * Key names and constants for Redis.
 */
export const REDIS_KEYS = {
  HANDOFF_HASH: 'handoff',
} as const

/**
 * Update the handoff status for a lead session.
 * HSET handoff {external_session_id} {status}
 */
export async function setRedisHandoff(externalSessionId: string, status: 'human' | 'ai'): Promise<boolean> {
  try {
    await redis.hset(REDIS_KEYS.HANDOFF_HASH, externalSessionId, status)
    return true
  } catch (error) {
    // SAFETY: if Redis is down and status is 'human', n8n will default to 'ai' on next check
    // and may auto-respond to a human-attended conversation. Monitor Redis health closely.
    console.error(`[HANDOFF SAFETY] Failed to set redis handoff for ${externalSessionId} → ${status}:`, error)
    return false
  }
}

/**
 * Get the handoff status for a lead session.
 */
export async function getRedisHandoff(externalSessionId: string): Promise<'human' | 'ai'> {
  try {
    const status = await redis.hget(REDIS_KEYS.HANDOFF_HASH, externalSessionId)
    return (status as 'human' | 'ai') || 'ai'
  } catch (error) {
    console.error(`Failed to get redis handoff for ${externalSessionId}:`, error)
    return 'ai' // Default to AI if Redis fails
  }
}

/**
 * Check if a lead is currently in human handoff mode in Redis.
 */
export async function isHumanHandoffRedis(externalSessionId: string): Promise<boolean> {
  const status = await getRedisHandoff(externalSessionId)
  return status === 'human'
}
