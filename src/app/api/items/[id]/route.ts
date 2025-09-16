import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get current user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the item to check ownership
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            user: true,
            salesUser: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if user has permission to delete this item
    const isOwner = item.inventory.userId === clerkUser.id;
    const isSalesRep = item.inventory.salesUserId === clerkUser.id;
    const isAdmin = clerkUser.publicMetadata?.role === 'admin' || clerkUser.publicMetadata?.role === 'company-admin';

    if (!isOwner && !isSalesRep && !isAdmin) {
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
    
    // Get current user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the item to check ownership
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            user: true,
            salesUser: true
          }
        }
      }
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if user has permission to update this item
    const isOwner = item.inventory.userId === clerkUser.id;
    const isSalesRep = item.inventory.salesUserId === clerkUser.id;
    const isAdmin = clerkUser.publicMetadata?.role === 'admin' || clerkUser.publicMetadata?.role === 'company-admin';

    if (!isOwner && !isSalesRep && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: body
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


