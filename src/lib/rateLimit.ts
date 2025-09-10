import { Redis } from "@upstash/redis";

type RateConfig = { key: string; points: number; windowSec: number; cost?: number };

const memory = new Map<string, { points: number; windowEnds: number }>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

/** Sliding window: points allowed per windowSec. Cost defaults to 1. */
export async function rateLimit({ key, points, windowSec, cost = 1 }: RateConfig) {
  if (redis) {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `rl:${key}:${Math.floor(now / windowSec)}`;
    const used = (await redis.incr(windowKey)) ?? 0;
    if (used === 1) await redis.expire(windowKey, windowSec + 1);
    const allowed = used + cost - 1 <= points;
    return { allowed, used, remaining: Math.max(0, points - used) };
  } else {
    const now = Date.now() / 1000;
    const v = memory.get(key);
    if (!v || v.windowEnds <= now) {
      memory.set(key, { points: cost, windowEnds: now + windowSec });
      return { allowed: true, used: cost, remaining: points - cost };
    }
    if (v.points + cost <= points) {
      v.points += cost;
      memory.set(key, v);
      return { allowed: true, used: v.points, remaining: points - v.points };
    }
    return { allowed: false, used: v.points, remaining: Math.max(0, points - v.points) };
  }
}
