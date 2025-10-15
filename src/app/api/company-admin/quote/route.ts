import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is company admin
    const userRole = await getUserRole(userId);
    if (userRole !== 'company-admin') {
      return NextResponse.json({ error: "Only company admins can create quotes" }, { status: 403 });
    }

    const body = await req.json();
    const { inventoryId, quote } = body;

    if (!inventoryId || !quote) {
      return NextResponse.json({ error: "Inventory ID and quote data are required" }, { status: 400 });
    }

    // Verify the inventory belongs to the user's company
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        companyId: user.companyId
      }
    });

    if (!inventory) {
      return NextResponse.json({ error: "Inventory not found or access denied" }, { status: 404 });
    }

    // Update inventory with quote information
    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        status: 'quoted',
        baseCost: quote.baseCost,
        additionalHandling: quote.additionalHandling,
        disposalCost: quote.disposalCost,
        storageCost: quote.storageCost,
        stairsCost: quote.stairsCost,
        packingCost: quote.packingCost,
        unpackingCost: quote.unpackingCost,
        distanceCost: quote.distanceCost,
        taxAmount: quote.taxAmount,
        totalCost: quote.totalCost,
        quotedAt: new Date(),
        note: quote.notes ? `${inventory.note}\n\nQuote Notes: ${quote.notes}` : inventory.note
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          select: {
            id: true,
            shortName: true,
            description: true,
            count: true
          }
        }
      }
    });

    // TODO: Send email notification to customer about the quote
    // This would integrate with your email service

    return NextResponse.json({
      success: true,
      inventory: updatedInventory,
      message: "Quote created successfully"
    });

  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ 
      error: "Failed to create quote", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
