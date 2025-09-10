import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const inv = await prisma.inventory.findUnique({
    where: { id: params.id },
    include: { items: true, photos: true },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await prisma.inventory.update({
    where: { id: params.id },
    data: {
      title: body.title,
      note: body.note,
    },
    include: { items: true, photos: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.inventory.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
