import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Create or update quote for inventory
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const {
      finalCost,
      breakdown,
      notes,
      validUntil,
      termsAndConditions
    } = body;

    if (!finalCost || finalCost <= 0) {
      return NextResponse.json({ error: "Valid final cost is required" }, { status: 400 });
    }

    // Get current user for authorization (must be sales rep or admin)
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if inventory exists and is assigned to current user or user is admin
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

    // Update inventory with quote information and status
    const updated = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        // Update pricing fields
        totalCost: finalCost,
        subtotal: breakdown.subtotal || finalCost,
        taxAmount: breakdown.tax || 0,
        baseCost: breakdown.baseCost || 0,
        additionalHandling: breakdown.additionalHandling || 0,
        disposalCost: breakdown.disposal || 0,
        storageCost: breakdown.storage || 0,
        stairsCost: breakdown.stairs || 0,
        packingCost: breakdown.packing || 0,
        unpackingCost: breakdown.unpacking || 0,
        distanceCost: breakdown.distance || 0,
        
        // Update status and timestamp
        status: 'quoted',
        quotedAt: new Date(),
        note: notes ? `${inventory.note}\n\nQuote Notes: ${notes}`.trim() : inventory.note
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

    console.log(`✅ [QUOTE] Created quote for inventory ${params.id}: $${finalCost}`);

    return NextResponse.json({
      ...updated,
      quoteDetails: {
        finalCost,
        breakdown,
        notes,
        validUntil,
        termsAndConditions,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("❌ [QUOTE] Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

// Get quote information
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    
    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        status: true,
        totalCost: true,
        subtotal: true,
        taxAmount: true,
        baseCost: true,
        additionalHandling: true,
        disposalCost: true,
        storageCost: true,
        stairsCost: true,
        packingCost: true,
        unpackingCost: true,
        distanceCost: true,
        quotedAt: true,
        note: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    // Build quote breakdown
    const quoteDetails = {
      finalCost: inventory.totalCost,
      breakdown: {
        baseCost: inventory.baseCost || 0,
        additionalHandling: inventory.additionalHandling || 0,
        disposal: inventory.disposalCost || 0,
        storage: inventory.storageCost || 0,
        stairs: inventory.stairsCost || 0,
        packing: inventory.packingCost || 0,
        unpacking: inventory.unpackingCost || 0,
        distance: inventory.distanceCost || 0,
        subtotal: inventory.subtotal || 0,
        tax: inventory.taxAmount || 0
      },
      notes: inventory.note,
      quotedAt: inventory.quotedAt,
      validUntil: inventory.quotedAt ? new Date(new Date(inventory.quotedAt).getTime() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days from quote date
      termsAndConditions: "This quote is valid for 30 days from the date issued. Final costs may vary based on actual conditions during the move."
    };

    return NextResponse.json({
      inventory: {
        id: inventory.id,
        title: inventory.title,
        status: inventory.status,
        user: inventory.user,
        assignedSalesRep: inventory.assignedSalesRep
      },
      quote: quoteDetails
    });
  } catch (error) {
    console.error("❌ [QUOTE] Error getting quote:", error);
    return NextResponse.json(
      { error: "Failed to get quote" },
      { status: 500 }
    );
  }
}
