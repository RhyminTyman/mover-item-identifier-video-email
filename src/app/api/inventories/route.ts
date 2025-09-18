import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnalysisSchema } from "@/types";
import { sendNewInventoryNotification } from "@/lib/email";

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
  try {
    console.log("🔍 [INVENTORIES GET] Starting database query...");
    console.log("🔍 [INVENTORIES GET] Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
    console.log("🔍 [INVENTORIES GET] Prisma client status:", prisma ? "Initialized" : "Not initialized");
    
    const inventories = await prisma.inventory.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true, photos: true },
    });
    
    console.log("✅ [INVENTORIES GET] Successfully retrieved", inventories.length, "inventories");
    return NextResponse.json(inventories);
  } catch (error) {
    console.error("❌ [INVENTORIES GET] Database error:", error);
    const err = error as Error;
    console.error("❌ [INVENTORIES GET] Error name:", err?.name);
    console.error("❌ [INVENTORIES GET] Error message:", err?.message);
    console.error("❌ [INVENTORIES GET] Error stack:", err?.stack);
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("❌ [INVENTORIES GET] Prisma error code:", (error as { code: string }).code);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to load inventories", 
        details: err?.message,
        type: err?.name 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
  }>;

  const created = await prisma.inventory.create({
    data: {
      title,
      note,
      items: {
        create: items.map((it) => ({
          shortName: it.shortName,
          description: it.description,
          notes: it.notes ?? "",
          lengthIn: it.estimatedDimensionsInches.length ?? null,
          widthIn: it.estimatedDimensionsInches.width ?? null,
          heightIn: it.estimatedDimensionsInches.height ?? null,
          count: it.count ?? 1,
          tags: it.tags ?? [],
          roomName: it.roomName ?? null,
        })),
      },
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
      items: true, 
      photos: true,
      user: true, // Include customer info for notifications
      company: true // Include company info for sales rep assignment
    },
  });

  // Notify sales reps about new inventory submission
  try {
    await notifySalesReps(created);
  } catch (error) {
    console.error("Failed to notify sales reps:", error);
    // Don't fail the request if notifications fail
  }

  return NextResponse.json(created, { status: 201 });
}
