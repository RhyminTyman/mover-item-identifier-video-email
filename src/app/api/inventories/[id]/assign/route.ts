import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { sendNewInventoryNotification } from "@/lib/email";

export const runtime = "nodejs";

// Assign a sales rep to an inventory
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const { salesRepId } = body;

    if (!salesRepId) {
      return NextResponse.json({ error: "Sales rep ID is required" }, { status: 400 });
    }

    // Get current user for authorization (must be admin or company-admin)
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if inventory exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: { 
        user: true, 
        company: true,
        assignedSalesRep: true 
      }
    });

    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    // Check if sales rep exists and is active
    const salesRep = await prisma.user.findUnique({
      where: { id: salesRepId },
      include: { company: true }
    });

    if (!salesRep || salesRep.role !== 'sales' || !salesRep.isActive) {
      return NextResponse.json({ error: "Invalid or inactive sales rep" }, { status: 400 });
    }

    // Check if sales rep belongs to the same company (if inventory has a company)
    if (inventory.companyId && salesRep.companyId !== inventory.companyId) {
      return NextResponse.json({ error: "Sales rep must belong to the same company" }, { status: 400 });
    }

    // Update inventory assignment
    const updated = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        assignedSalesRepId: salesRepId,
        status: 'assigned',
        assignedAt: new Date()
      },
      include: { 
        items: true, 
        photos: true,
        user: true,
        company: true,
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

    // Send notification to the assigned sales rep
    try {
      await sendNewInventoryNotification({
        salesRepEmail: salesRep.email,
        salesRepName: `${salesRep.firstName} ${salesRep.lastName}`,
        inventoryId: inventory.id,
        inventoryTitle: inventory.title,
        customerName: inventory.user ? `${inventory.user.firstName} ${inventory.user.lastName}` : 'Unknown Customer',
        customerEmail: inventory.user?.email || 'Unknown Email',
        itemCount: updated.items.length,
        companyName: inventory.company?.name || 'Smart Move Inventory',
        submittedAt: inventory.createdAt
      });
    } catch (error) {
      console.error("Failed to send assignment notification:", error);
      // Don't fail the request if notification fails
    }

    console.log(`✅ [ASSIGN] Assigned inventory ${params.id} to sales rep ${salesRep.email}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ [ASSIGN] Error assigning sales rep:", error);
    return NextResponse.json(
      { error: "Failed to assign sales rep" },
      { status: 500 }
    );
  }
}

// Get available sales reps for assignment
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
    // Get inventory to check company
    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      select: { companyId: true }
    });

    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found" }, { status: 404 });
    }

    // Get available sales reps
    const salesReps = await prisma.user.findMany({
      where: {
        role: 'sales',
        isActive: true,
        ...(inventory.companyId && { companyId: inventory.companyId })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: {
          select: {
            name: true
          }
        },
        assignedInventories: {
          where: {
            status: {
              in: ['assigned', 'verified', 'quoted']
            }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    // Add workload information
    const salesRepsWithWorkload = salesReps.map(rep => ({
      ...rep,
      currentWorkload: rep.assignedInventories.length,
      fullName: `${rep.firstName} ${rep.lastName}`
    }));

    return NextResponse.json(salesRepsWithWorkload);
  } catch (error) {
    console.error("❌ [ASSIGN] Error getting sales reps:", error);
    return NextResponse.json(
      { error: "Failed to get sales reps" },
      { status: 500 }
    );
  }
}

// Unassign sales rep from inventory
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;

    // Get current user for authorization
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update inventory to remove assignment
    const updated = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        assignedSalesRepId: null,
        status: 'submitted',
        assignedAt: null
      },
      include: { 
        items: true, 
        photos: true,
        user: true,
        company: true,
        assignedSalesRep: true
      }
    });

    console.log(`✅ [ASSIGN] Unassigned sales rep from inventory ${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ [ASSIGN] Error unassigning sales rep:", error);
    return NextResponse.json(
      { error: "Failed to unassign sales rep" },
      { status: 500 }
    );
  }
}
