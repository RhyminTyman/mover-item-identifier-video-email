import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userRole = await getUserRole(userId);
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { id: companyId } = await params;
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.name || !updateData.address || !updateData.city || !updateData.state || !updateData.zipCode) {
      return NextResponse.json({ 
        error: "Missing required fields: name, address, city, state, zipCode" 
      }, { status: 400 });
    }

    // Update the company
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: updateData.name,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        zipCode: updateData.zipCode,
        phone: updateData.phone || null,
        email: updateData.email || null,
        website: updateData.website || null,
        baseCostPerHour: updateData.baseCostPerHour || 50.0,
        costPerMile: updateData.costPerMile || 2.0,
        costPerCubicFoot: updateData.costPerCubicFoot || 0.5,
        costPerPound: updateData.costPerPound || 0.1,
        stairCostPerFlight: updateData.stairCostPerFlight || 10.0,
        packingCostPerBox: updateData.packingCostPerBox || 5.0,
        unpackingCostPerBox: updateData.unpackingCostPerBox || 3.0,
        disposalCost: updateData.disposalCost || 25.0,
        storageCostPerDay: updateData.storageCostPerDay || 10.0,
        rushServiceMultiplier: updateData.rushServiceMultiplier || 1.5,
        taxRate: updateData.taxRate || 8.0,
        updatedAt: new Date()
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
        },
        _count: {
          select: {
            users: true,
            inventories: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      company: updatedCompany 
    });

  } catch (error) {
    console.error("Error updating company:", error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ 
        error: "Company not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
