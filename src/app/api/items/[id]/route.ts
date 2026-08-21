import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthedUser, canMutateInventory } from "@/lib/authz";

// Only these Item columns may be set from a request body. Previously the raw
// body was passed straight to prisma.update, which let a caller rewrite any
// column - including `inventoryId`, i.e. move someone else's item into their
// own inventory.
const UPDATABLE_ITEM_FIELDS = [
  "shortName",
  "description",
  "notes",
  "lengthIn",
  "widthIn",
  "heightIn",
  "count",
  "tags",
  "roomName",
] as const;

function pickItemUpdate(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const field of UPDATABLE_ITEM_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Resolve to the internal User row: inventory.userId / salesUserId are
    // cuids from our own User table, never Clerk ids.
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the item to check ownership
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        inventory: {
          select: {
            userId: true,
            salesUserId: true,
            assignedSalesRepId: true,
            companyId: true,
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Role lives in our database, not Clerk publicMetadata (which is never
    // populated by this app), so the previous publicMetadata check was dead.
    if (!canMutateInventory(user, item.inventory)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the item
    await prisma.item.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Resolve to the internal User row: inventory.userId / salesUserId are
    // cuids from our own User table, never Clerk ids.
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the item to check ownership
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        inventory: {
          select: {
            userId: true,
            salesUserId: true,
            assignedSalesRepId: true,
            companyId: true,
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Role lives in our database, not Clerk publicMetadata (which is never
    // populated by this app), so the previous publicMetadata check was dead.
    if (!canMutateInventory(user, item.inventory)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: pickItemUpdate(body as Record<string, unknown>)
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}


