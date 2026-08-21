import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnalysisSchema } from "@/types";
import { sendNewInventoryNotification } from "@/lib/email";
import { getAuthedUser, inventoryScopeFilter } from "@/lib/authz";

// Helper function to notify sales reps about new inventory
async function notifySalesReps(inventory: {
  id: string;
  title: string;
  createdAt: Date;
  items: { id: string; shortName: string }[];
  user?: { firstName: string; lastName: string; email: string } | null;
  company?: { name: string } | null;
  companyId?: string | null;
}) {
  try {
    // Get all active sales reps for the company (or all sales reps if no company)
    const salesReps = await prisma.user.findMany({
      where: {
        role: 'sales',
        isActive: true,
        ...(inventory.companyId && { companyId: inventory.companyId })
      }
    });

    if (salesReps.length === 0) {
      console.log("No active sales reps found for company:", inventory.companyId);
      return;
    }

    // Send notification to each sales rep
    const notificationPromises = salesReps.map(async (salesRep) => {
      try {
        await sendNewInventoryNotification({
          salesRepEmail: salesRep.email,
          salesRepName: `${salesRep.firstName} ${salesRep.lastName}`,
          inventoryId: inventory.id,
          inventoryTitle: inventory.title,
          customerName: inventory.user ? `${inventory.user.firstName} ${inventory.user.lastName}` : 'Unknown Customer',
          customerEmail: inventory.user?.email || 'Unknown Email',
          itemCount: inventory.items.length,
          companyName: inventory.company?.name || 'Barreleyes',
          submittedAt: inventory.createdAt
        });
      } catch (error) {
        console.error(`Failed to notify sales rep ${salesRep.email}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`Sent notifications to ${salesReps.length} sales reps for inventory ${inventory.id}`);
  } catch (error) {
    console.error("Error in notifySalesReps:", error);
    throw error;
  }
}

export async function GET() {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const inventories = await prisma.inventory.findMany({
      where: inventoryScopeFilter(user),
      orderBy: { createdAt: "desc" },
      include: { items: true, photos: true },
    });

    return NextResponse.json(inventories);
  } catch (error) {
    console.error("[INVENTORIES GET] Database error:", error);
    return NextResponse.json({ error: "Failed to load inventories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAuthedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = AnalysisSchema.safeParse(body.analysis);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analysis payload" }, { status: 400 });
  }

  const title = (body.title ?? "Untitled") as string;
  const note = (body.note ?? "") as string;
  const photos = (body.photos ?? []) as Array<{ filename: string; mimeType: string; url: string; key?: string; bucket?: string; roomName?: string | null }>;
  const items  = parsed.data.items as Array<{
    shortName: string;
    description: string;
    notes?: string;
    tags?: string[];
    count?: number;
    estimatedDimensionsInches: { length: number | null; width: number | null; height: number | null; };
    roomName?: string | null;
    boundingBox?: { x: number; y: number; width: number; height: number } | null;
    sourceImageIndex?: number;
  }>;

  // Create inventory with photos first
  const created = await prisma.inventory.create({
    data: {
      title,
      note,
      // Without these the inventory is orphaned: invisible to its own creator
      // under the scoped list query, and unroutable to the right sales team.
      userId: user.id,
      companyId: user.companyId,
      photos: {
        create: photos.map((p) => ({
          filename: p.filename,
          mimeType: p.mimeType,
          url: p.url,
          key: p.key ?? "",
          bucket: p.bucket ?? "",
          roomName: p.roomName ?? null,
        })),
      },
    },
    include: { 
      photos: true,
    },
  });

  // Now create items with photo references
  await prisma.item.createMany({
    data: items.map((it) => {
      // Find the matching photo based on sourceImageIndex
      let sourcePhotoId: string | null = null;
      if (it.sourceImageIndex !== undefined && it.sourceImageIndex >= 0 && it.sourceImageIndex < created.photos.length) {
        sourcePhotoId = created.photos[it.sourceImageIndex].id;
      }

      return {
        inventoryId: created.id,
        shortName: it.shortName,
        description: it.description,
        notes: it.notes ?? "",
        lengthIn: it.estimatedDimensionsInches.length ?? null,
        widthIn: it.estimatedDimensionsInches.width ?? null,
        heightIn: it.estimatedDimensionsInches.height ?? null,
        count: it.count ?? 1,
        tags: it.tags ?? [],
        roomName: it.roomName ?? null,
        sourcePhotoId: sourcePhotoId,
        boundingBoxX: it.boundingBox?.x ?? null,
        boundingBoxY: it.boundingBox?.y ?? null,
        boundingBoxWidth: it.boundingBox?.width ?? null,
        boundingBoxHeight: it.boundingBox?.height ?? null,
        sourceImageIndex: it.sourceImageIndex ?? null,
      };
    }),
  });

  // Fetch the complete inventory with items for response
  const completeInventory = await prisma.inventory.findUnique({
    where: { id: created.id },
    include: { 
      items: true, 
      photos: true,
      user: true, // Include customer info for notifications
      company: true // Include company info for sales rep assignment
    },
  });

  // Notify sales reps about new inventory submission
  try {
    if (completeInventory) {
      await notifySalesReps(completeInventory);
    }
  } catch (error) {
    console.error("Failed to notify sales reps:", error);
    // Don't fail the request if notifications fail
  }

  return NextResponse.json(completeInventory, { status: 201 });
}
