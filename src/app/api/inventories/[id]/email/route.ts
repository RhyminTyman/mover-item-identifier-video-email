import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const MAIL_FROM = process.env.MAIL_FROM || "Barreleyes <onboarding@resend.dev>";

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

  try {
    if (!resend) {
      return NextResponse.json({ error: "Resend API key not configured. Please set RESEND_API_KEY environment variable." }, { status: 500 });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [to],
      subject: `Inventory: ${inv.title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Moving Inventory Report</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📦 Your Moving Inventory Report</h1>
                <p>${inv.title}</p>
              </div>
              <div class="content">
                <h2>Hello!</h2>
                <p>Your moving inventory has been processed and is ready for review.</p>
                
                ${note ? `<div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
                  <strong>Note:</strong><br>
                  ${note}
                </div>` : ''}
                
                <p>You can view and download your inventory report using the link below:</p>
                
                <div style="text-align: center;">
                  <a href="${pdfUrl}" class="button">View Inventory Report</a>
                </div>
                
                <p>This report contains all the items identified in your moving inventory, organized by room and category.</p>
                
                <p><strong>CSV Data:</strong></p>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${csv}</pre>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: emailData });
  } catch (error) {
    console.error('Error sending inventory email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
