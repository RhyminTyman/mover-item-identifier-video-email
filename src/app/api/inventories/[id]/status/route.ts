import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Update inventory status
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const { status, assignedSalesRepId } = body;

    // Validate status
    const validStatuses = ['submitted', 'assigned', 'verified', 'quoted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current user for authorization
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if inventory exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: { user: true, company: true }
    });

    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      status: string;
      assignedAt?: Date;
      assignedSalesRepId?: string;
      verifiedAt?: Date;
      quotedAt?: Date;
      acceptedAt?: Date;
    } = {
      status
    };

    // Set timestamp based on status
    switch (status) {
      case 'assigned':
        updateData.assignedAt = new Date();
        updateData.assignedSalesRepId = assignedSalesRepId;
        break;
      case 'verified':
        updateData.verifiedAt = new Date();
        break;
      case 'quoted':
        updateData.quotedAt = new Date();
        break;
      case 'accepted':
        updateData.acceptedAt = new Date();
        break;
    }

    // Update inventory
    const updated = await prisma.inventory.update({
      where: { id: params.id },
      data: updateData,
      include: { 
        items: true, 
        photos: true,
        user: true,
        company: true,
        assignedSalesRep: true
      }
    });

    console.log(`✅ [STATUS] Updated inventory ${params.id} to status: ${status}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ [STATUS] Error updating inventory status:", error);
    return NextResponse.json(
      { error: "Failed to update inventory status" },
      { status: 500 }
    );
  }
}

// Get inventory status
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        verifiedAt: true,
        quotedAt: true,
        acceptedAt: true,
        assignedSalesRep: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("❌ [STATUS] Error getting inventory status:", error);
    return NextResponse.json(
      { error: "Failed to get inventory status" },
      { status: 500 }
    );
  }
}
