import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

console.log("🔧 [DB] Initializing Prisma client...");
console.log("🔧 [DB] Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
console.log("🔧 [DB] NODE_ENV:", process.env.NODE_ENV);

// Create a placeholder Prisma client for build time
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ [DB] DATABASE_URL not found in environment variables");
    // Return a mock client for build time
    return new PrismaClient({
      log: ["error"],
      datasources: {
        db: {
          url: "postgresql://placeholder:placeholder@localhost:5432/placeholder",
        },
      },
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Note: beforeExit hook is not available in Prisma 5.0+ library engine

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

console.log("✅ [DB] Prisma client initialized");
