import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
    redis: {
      status: "healthy" | "unavailable";
      error?: string;
    };
    openai: {
      status: "configured" | "not_configured";
    };
    s3: {
      status: "configured" | "not_configured";
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: {
        status: "unhealthy"
      },
      redis: {
        status: "unavailable"
      },
      openai: {
        status: "not_configured"
      },
      s3: {
        status: "not_configured"
      }
    }
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbTime = Date.now() - dbStart;
    health.checks.database = {
      status: "healthy",
      responseTime: dbTime
    };
  } catch (error) {
    health.checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error"
    };
    health.status = "degraded";
  }

  // Check Redis (optional)
  try {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (redisUrl && redisToken) {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({ url: redisUrl, token: redisToken });
      await redis.ping();
      health.checks.redis = {
        status: "healthy"
      };
    } else {
      health.checks.redis = {
        status: "unavailable",
        error: "Redis not configured"
      };
    }
  } catch (error) {
    health.checks.redis = {
      status: "unavailable",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }

  // Check OpenAI configuration
  health.checks.openai = {
    status: process.env.OPENAI_API_KEY ? "configured" : "not_configured"
  };

  // Check S3 configuration
  const s3Configured = !!(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );
  health.checks.s3 = {
    status: s3Configured ? "configured" : "not_configured"
  };

  // Determine overall health status
  if (health.checks.database.status === "unhealthy") {
    health.status = "unhealthy";
  } else if (
    health.checks.openai.status === "not_configured" ||
    health.checks.s3.status === "not_configured"
  ) {
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

