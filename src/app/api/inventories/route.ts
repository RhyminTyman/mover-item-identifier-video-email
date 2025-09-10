import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AnalysisSchema } from "@/types";

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
    console.error("❌ [INVENTORIES GET] Error name:", (error as any)?.name);
    console.error("❌ [INVENTORIES GET] Error message:", (error as any)?.message);
    console.error("❌ [INVENTORIES GET] Error code:", (error as any)?.code);
    console.error("❌ [INVENTORIES GET] Error stack:", (error as any)?.stack);
    
    // Check if it's a Prisma error
    if ((error as any)?.code) {
      console.error("❌ [INVENTORIES GET] Prisma error code:", (error as any).code);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to load inventories", 
        details: (error as any)?.message,
        code: (error as any)?.code,
        type: (error as any)?.name 
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
    include: { items: true, photos: true },
  });

  return NextResponse.json(created, { status: 201 });
}
