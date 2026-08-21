import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthedUser,
  canAccessInventory,
  canMutateInventory,
  inventoryAccessSelect,
} from "@/lib/authz";

/**
 * Load the inventory and confirm the caller may touch it.
 * Returns a NextResponse to short-circuit with, or the resolved user.
 * A 404 (not 403) is returned for inventories the caller may not see, so this
 * endpoint cannot be used to probe for valid inventory ids.
 */
async function authorize(id: string, mode: "read" | "write") {
  const user = await getAuthedUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const scope = await prisma.inventory.findUnique({
    where: { id },
    select: inventoryAccessSelect,
  });
  if (!scope) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  const allowed =
    mode === "read" ? canAccessInventory(user, scope) : canMutateInventory(user, scope);
  if (!allowed) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  return { user };
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gate = await authorize(id, "read");
  if (gate.error) return gate.error;

  const inv = await prisma.inventory.findUnique({
    where: { id },
    include: { items: true, photos: true },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gate = await authorize(id, "write");
  if (gate.error) return gate.error;

  const body = await req.json();
  const updated = await prisma.inventory.update({
    where: { id },
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
  const { id } = await context.params;
  const gate = await authorize(id, "write");
  if (gate.error) return gate.error;

  await prisma.inventory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
