import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Get all CRM schedules for the company
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

    // Get all schedules for the company's integrations
    const schedules = await prisma.crmSchedule.findMany({
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
        },
        lead: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("❌ [CRM SCHEDULES GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get CRM schedules" },
      { status: 500 }
    );
  }
}
