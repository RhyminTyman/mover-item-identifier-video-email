import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const inv = await prisma.inventory.findUnique({
    where: { id: params.id },
    include: { items: true, photos: true },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const body = await req.json();
  const updated = await prisma.inventory.update({
    where: { id: params.id },
    data: {
      title: body.title,
      note: body.note,
      // Pricing data
      moveDate: body.moveDate ? new Date(body.moveDate) : undefined,
      originAddress: body.originAddress,
      destinationAddress: body.destinationAddress,
      distance: body.distance,
      accessType: body.accessType,
      stairFlights: body.stairFlights,
      rushService: body.rushService,
      sameBuilding: body.sameBuilding,
      packingBoxes: body.packingBoxes,
      unpackingBoxes: body.unpackingBoxes,
      disposalNeeded: body.disposalNeeded,
      storageNeeded: body.storageNeeded,
      totalCubicFeet: body.totalCubicFeet,
      totalWeight: body.totalWeight,
      estimatedHours: body.estimatedHours,
      baseCost: body.baseCost,
      additionalHandling: body.additionalHandling,
      disposalCost: body.disposalCost,
      storageCost: body.storageCost,
      stairsCost: body.stairsCost,
      packingCost: body.packingCost,
      unpackingCost: body.unpackingCost,
      distanceCost: body.distanceCost,
      subtotal: body.subtotal,
      taxAmount: body.taxAmount,
      totalCost: body.totalCost,
    },
    include: { items: true, photos: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  await prisma.inventory.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
