import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    console.log("🔍 [DEBUG DB] Starting database connection test...");
    
    // Test basic connection
    console.log("🔍 [DEBUG DB] Testing basic connection...");
    await prisma.$connect();
    console.log("✅ [DEBUG DB] Basic connection successful");
    
    // Test simple query
    console.log("🔍 [DEBUG DB] Testing simple query...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ [DEBUG DB] Simple query successful:", result);
    
    // Test table existence
    console.log("🔍 [DEBUG DB] Testing table existence...");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("✅ [DEBUG DB] Tables found:", tables);
    
    // Test inventory table specifically
    console.log("🔍 [DEBUG DB] Testing inventory table access...");
    const inventoryCount = await prisma.inventory.count();
    console.log("✅ [DEBUG DB] Inventory count:", inventoryCount);
    
    return NextResponse.json({
      success: true,
      message: "Database connection test successful",
      details: {
        connection: "OK",
        simpleQuery: "OK",
        tables: tables,
        inventoryCount: inventoryCount
      }
    });
    
  } catch (error) {
    console.error("❌ [DEBUG DB] Database test failed:", error);
    console.error("❌ [DEBUG DB] Error name:", error?.name);
    console.error("❌ [DEBUG DB] Error message:", error?.message);
    console.error("❌ [DEBUG DB] Error code:", error?.code);
    console.error("❌ [DEBUG DB] Error stack:", error?.stack);
    
    return NextResponse.json({
      success: false,
      error: "Database connection test failed",
      details: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      }
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
      console.log("🔧 [DEBUG DB] Database disconnected");
    } catch (disconnectError) {
      console.error("❌ [DEBUG DB] Error disconnecting:", disconnectError);
    }
  }
}
