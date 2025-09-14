import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Update CRM integration
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData = body;

    // Get user's company
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { company: true }
    });

    if (!dbUser || !dbUser.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user is admin or company-admin
    if (!['admin', 'company-admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Check if integration belongs to user's company
    const integration = await prisma.crmIntegration.findFirst({
      where: {
        id: params.id,
        companyId: dbUser.company.id
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Update the integration
    const updated = await prisma.crmIntegration.update({
      where: { id: params.id },
      data: updateData
    });

    console.log(`✅ [CRM INTEGRATIONS PATCH] Updated integration: ${params.id}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ [CRM INTEGRATIONS PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update CRM integration" },
      { status: 500 }
    );
  }
}

// Delete CRM integration
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
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
    if (!['admin', 'company-admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Check if integration belongs to user's company
    const integration = await prisma.crmIntegration.findFirst({
      where: {
        id: params.id,
        companyId: dbUser.company.id
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    // Delete the integration (this will cascade delete related records)
    await prisma.crmIntegration.delete({
      where: { id: params.id }
    });

    console.log(`✅ [CRM INTEGRATIONS DELETE] Deleted integration: ${params.id}`);

    return NextResponse.json({ message: "Integration deleted successfully" });
  } catch (error) {
    console.error("❌ [CRM INTEGRATIONS DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete CRM integration" },
      { status: 500 }
    );
  }
}
