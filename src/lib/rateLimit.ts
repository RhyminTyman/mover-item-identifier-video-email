import { Redis } from "@upstash/redis";

type RateConfig = { key: string; points: number; windowSec: number; cost?: number };

const memory = new Map<string, { points: number; windowEnds: number }>();

// The in-memory fallback is only correct for a single process, and without
// eviction it grows once per distinct key forever. Sweep expired entries
// periodically rather than on every call.
const MEMORY_SWEEP_INTERVAL_MS = 60_000;
let lastSweep = 0;

function sweepMemory(nowSec: number) {
  if (Date.now() - lastSweep < MEMORY_SWEEP_INTERVAL_MS) return;
  lastSweep = Date.now();
  for (const [k, v] of memory) {
    if (v.windowEnds <= nowSec) memory.delete(k);
  }
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

/** Fixed window: `points` allowed per `windowSec`. Cost defaults to 1. */
export async function rateLimit({ key, points, windowSec, cost = 1 }: RateConfig) {
  if (redis) {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `rl:${key}:${Math.floor(now / windowSec)}`;

    // incrby, not incr: the previous code always charged exactly 1 no matter
    // what `cost` said, so weighted calls were never actually metered.
    const used = (await redis.incrby(windowKey, cost)) ?? cost;
    if (used === cost) await redis.expire(windowKey, windowSec + 1);

    return {
      allowed: used <= points,
      used,
      remaining: Math.max(0, points - used),
    };
  }

  const now = Date.now() / 1000;
  sweepMemory(now);

  const v = memory.get(key);
  if (!v || v.windowEnds <= now) {
    memory.set(key, { points: cost, windowEnds: now + windowSec });
    return { allowed: cost <= points, used: cost, remaining: Math.max(0, points - cost) };
  }
  if (v.points + cost <= points) {
    v.points += cost;
    return { allowed: true, used: v.points, remaining: points - v.points };
  }
  return { allowed: false, used: v.points, remaining: Math.max(0, points - v.points) };
}
