import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyId,
      customerName,
      customerEmail,
      customerPhone,
      moveDate,
      originAddress,
      destinationAddress,
      distance,
      accessType,
      rushService,
      sameBuilding,
      stairFlights,
      packingBoxes,
      unpackingBoxes,
      disposalNeeded,
      storageNeeded,
      selectedItems,
      totalCubicFeet,
      totalWeight,
      estimatedHours,
      baseCost,
      additionalHandling,
      disposalCost,
      storageCost,
      stairsCost,
      packingCost,
      unpackingCost,
      distanceCost,
      subtotal,
      taxAmount,
      totalCost,
      items
    } = body;

    // Validate required fields
    if (!companyId || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ 
        error: "Missing required fields: companyId, customerName, customerEmail, customerPhone" 
      }, { status: 400 });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get or create customer user
    let customerUser = await prisma.user.findFirst({
      where: { email: customerEmail }
    });

    if (!customerUser) {
      // Create customer user if doesn't exist
      customerUser = await prisma.user.create({
        data: {
          clerkId: `customer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          email: customerEmail,
          firstName: customerName.split(' ')[0] || 'Customer',
          lastName: customerName.split(' ').slice(1).join(' ') || 'User',
          role: 'customer',
          isActive: true,
          onboarded: true
        }
      });
    }

    // Create inventory record
    const inventory = await prisma.inventory.create({
      data: {
        title: `Quote Request - ${customerName}`,
        note: `Quote request submitted on ${new Date().toLocaleDateString()}. Move date: ${moveDate || 'Not specified'}. Origin: ${originAddress || 'Not specified'}. Destination: ${destinationAddress || 'Not specified'}.`,
        status: 'submitted',
        moveDate: moveDate ? new Date(moveDate) : null,
        totalCost: totalCost,
        baseCost: baseCost,
        additionalHandling: additionalHandling,
        disposalCost: disposalCost,
        storageCost: storageCost,
        stairsCost: stairsCost,
        packingCost: packingCost,
        unpackingCost: unpackingCost,
        distanceCost: distanceCost,
        taxAmount: taxAmount,
        subtotal: subtotal,
        distance: distance,
        accessType: accessType,
        rushService: rushService,
        sameBuilding: sameBuilding,
        stairFlights: stairFlights,
        packingBoxes: packingBoxes,
        unpackingBoxes: unpackingBoxes,
        disposalNeeded: disposalNeeded,
        storageNeeded: storageNeeded,
        totalCubicFeet: totalCubicFeet,
        totalWeight: totalWeight,
        estimatedHours: estimatedHours,
        userId: customerUser.id,
        companyId: companyId
      }
    });

    // Create item records
    if (items && items.length > 0) {
      await prisma.item.createMany({
        data: items.map((item: any) => ({
          inventoryId: inventory.id,
          shortName: item.shortName,
          description: item.description,
          notes: item.notes || '',
          lengthIn: item.estimatedDimensionsInches?.length || null,
          widthIn: item.estimatedDimensionsInches?.width || null,
          heightIn: item.estimatedDimensionsInches?.height || null,
          count: item.count || 1,
          tags: item.tags || [],
          roomName: item.roomName || null
        }))
      });
    }

    // Generate quote ID
    const quoteId = `Q${Date.now().toString().slice(-8)}`;

    return NextResponse.json({
      success: true,
      quoteId,
      inventoryId: inventory.id,
      message: "Quote submitted successfully"
    });

  } catch (error) {
    console.error("Error submitting quote:", error);
    return NextResponse.json({ 
      error: "Failed to submit quote", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
