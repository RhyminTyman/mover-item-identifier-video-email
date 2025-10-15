import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is company admin
    const userRole = await getUserRole(userId);
    if (userRole !== 'company-admin') {
      return NextResponse.json({ error: "Only company admins can access this" }, { status: 403 });
    }

    // Get user's company ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get inventories for this company
    const inventories = await prisma.inventory.findMany({
      where: { companyId: user.companyId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          select: {
            id: true,
            shortName: true,
            description: true,
            count: true
          }
        },
        assignedSalesRep: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(inventories);

  } catch (error) {
    console.error("Error fetching inventories:", error);
    return NextResponse.json({ 
      error: "Failed to fetch inventories", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
