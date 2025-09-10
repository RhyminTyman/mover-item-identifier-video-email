import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

export async function GET(_: Request, context: any) {
  const { params } = context;
  const inv = await prisma.inventory.findUnique({ where: { id: params.id }, include: { items: true, photos: true } });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const doc = new PDFDocument({ size: "LETTER", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(18).text(inv.title);
  doc.moveDown(0.25);
  doc.fontSize(10).fillColor("#555").text(`Created: ${new Date(inv.createdAt).toLocaleString()}`);
  if (inv.note) { doc.moveDown(0.25); doc.fillColor("#333").text(inv.note); }
  doc.moveDown(0.5);
  doc.fillColor("#111").fontSize(12).text(`Items (${inv.items.length})`);
  doc.moveDown(0.25);

  inv.items.forEach((i, idx) => {
    doc.fontSize(10).fillColor("#111").text(`${idx + 1}. ${i.shortName}`);
    doc.fillColor("#333").text(i.description);
    const dims = [i.lengthIn ?? "—", i.widthIn ?? "—", i.heightIn ?? "—"].join(" × ");
    doc.fillColor("#555").text(`L×W×H (in): ${dims}`);
    const tags = (i.tags ?? []).join(", ");
    const room = i.roomName ? `Room: ${i.roomName}` : "";
    const extra = [i.notes, tags, room].filter(Boolean).join(" • ");
    if (extra) doc.fillColor("#666").text(extra);
    doc.moveDown(0.4);
    if (doc.y > doc.page.height - 72) doc.addPage();
  });

  doc.end();
  const buf = await done;

  return new NextResponse(buf as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inventory-${inv.id}.pdf"`,
      "Content-Length": String(buf.length),
    },
  });
}
