import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Get all CRM leads for the company
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { company: true }
    });

    if (!dbUser || !dbUser.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user is admin or company-admin
    if (!['admin', 'company-admin', 'sales'].includes(dbUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get all leads for the company's integrations
    const leads = await prisma.crmLead.findMany({
      where: {
        integration: {
          companyId: dbUser.company.id
        },
        isActive: true
      },
      include: {
        integration: {
          select: {
            name: true,
            provider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("❌ [CRM LEADS GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get CRM leads" },
      { status: 500 }
    );
  }
}
