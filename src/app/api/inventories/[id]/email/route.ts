import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getTransport, MAIL_FROM } from "@/lib/email";

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

function toCSV(items: InventoryItem[]) {
  const rows = [
    ["shortName", "description", "notes", "lengthIn", "widthIn", "heightIn", "tags", "roomName"],
    ...items.map(i => [
      i.shortName,
      String(i.description || "").replace(/\n/g, " "),
      i.notes ?? "",
      i.lengthIn ?? "",
      i.widthIn ?? "",
      i.heightIn ?? "",
      (i.tags ?? []).join("|"),
      i.roomName ?? ""
    ])
  ];
  return rows.map(r => r.map(cell => {
    const s = String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
}

function getBaseUrl(req: Request) {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const proto = (req.headers.get("x-forwarded-proto") || "http");
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000");
  return `${proto}://${host}`;
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { to, note } = await req.json();
  if (!to) return NextResponse.json({ error: "Missing 'to' email" }, { status: 400 });

  const inv = await prisma.inventory.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const csv = toCSV(inv.items);
  const base = getBaseUrl(req);
  const pdfUrl = `${base}/api/inventories/${inv.id}/export/pdf`;

  const transporter = getTransport();
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: `Inventory: ${inv.title}`,
    text: `Here is the inventory "${inv.title}".${note ? "\n\nNote: " + note : ""}\n\nPDF: ${pdfUrl}`,
    attachments: [
      { filename: `inventory-${inv.id}.csv`, content: csv, contentType: "text/csv" }
    ]
  });

  return NextResponse.json({ ok: true });
}
