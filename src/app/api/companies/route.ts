import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Get all companies with basic info (no authentication required for testing)
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        email: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            inventories: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true,
      companies,
      count: companies.length 
    });

  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ 
      success: false,
      error: "Internal server error" 
    }, { status: 500 });
  }
}
