import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
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
        baseCostPerHour: true,
        costPerMile: true,
        costPerCubicFoot: true,
        costPerPound: true,
        stairCostPerFlight: true,
        packingCostPerBox: true,
        unpackingCostPerBox: true,
        disposalCost: true,
        storageCostPerDay: true,
        rushServiceMultiplier: true,
        taxRate: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ companies });

  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ 
      error: "Failed to fetch companies", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}