import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is company admin
    const userRole = await getUserRole(userId);
    if (userRole !== 'company-admin') {
      return NextResponse.json({ error: "Only company admins can access this" }, { status: 403 });
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(user.company);

  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ 
      error: "Failed to fetch company", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is company admin
    const userRole = await getUserRole(userId);
    if (userRole !== 'company-admin') {
      return NextResponse.json({ error: "Only company admins can update company" }, { status: 403 });
    }

    const body = await req.json();

    // Get user's company ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        phone: body.phone,
        email: body.email,
        website: body.website,
        baseCostPerHour: body.baseCostPerHour,
        costPerMile: body.costPerMile,
        costPerCubicFoot: body.costPerCubicFoot,
        costPerPound: body.costPerPound,
        stairCostPerFlight: body.stairCostPerFlight,
        packingCostPerBox: body.packingCostPerBox,
        unpackingCostPerBox: body.unpackingCostPerBox,
        disposalCost: body.disposalCost,
        storageCostPerDay: body.storageCostPerDay,
        rushServiceMultiplier: body.rushServiceMultiplier,
        taxRate: body.taxRate
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    return NextResponse.json(updatedCompany);

  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ 
      error: "Failed to update company", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
