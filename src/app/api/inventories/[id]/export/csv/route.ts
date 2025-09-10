import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface InventoryItem {
  shortName: string;
  description: string | null;
  notes: string | null;
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
  tags: string[] | null;
  roomName: string | null;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const inv = await prisma.inventory.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = [
    ["shortName", "description", "notes", "lengthIn", "widthIn", "heightIn", "tags", "roomName"],
    ...inv.items.map((i: InventoryItem) => [
      i.shortName,
      (i.description || "").replace(/\n/g, " "),
      i.notes ?? "",
      i.lengthIn ?? "",
      i.widthIn ?? "",
      i.heightIn ?? "",
      (i.tags ?? []).join("|"),
      i.roomName ?? ""
    ])
  ];

  const csv = rows.map(r => r.map((cell: string | number) => {
    const s = String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-${inv.id}.csv"`,
    },
  });
}
