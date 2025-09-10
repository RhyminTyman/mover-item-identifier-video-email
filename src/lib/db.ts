import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

console.log("🔧 [DB] Initializing Prisma client...");
console.log("🔧 [DB] Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
console.log("🔧 [DB] NODE_ENV:", process.env.NODE_ENV);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Note: beforeExit hook is not available in Prisma 5.0+ library engine

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

console.log("✅ [DB] Prisma client initialized");
