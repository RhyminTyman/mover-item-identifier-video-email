import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Get basic stats
    const inventoryCount = await prisma.inventory.count();
    const itemCount = await prisma.item.count();
    const photoCount = await prisma.photo.count();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      stats: {
        inventories: inventoryCount,
        items: itemCount,
        photos: photoCount,
      }
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}