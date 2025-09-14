import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Get all CRM integrations for the company
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
    if (!['admin', 'company-admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const integrations = await prisma.crmIntegration.findMany({
      where: { companyId: dbUser.company.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("❌ [CRM INTEGRATIONS GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to get CRM integrations" },
      { status: 500 }
    );
  }
}

// Create a new CRM integration
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      provider,
      name,
      description,
      apiEndpoint,
      apiKey,
      apiSecret,
      webhookUrl,
      syncLeads,
      syncSales,
      syncSchedule,
      syncCustomers
    } = body;

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

    // Validate required fields
    if (!provider || !name) {
      return NextResponse.json({ error: "Provider and name are required" }, { status: 400 });
    }

    // Create the CRM integration
    const integration = await prisma.crmIntegration.create({
      data: {
        companyId: dbUser.company.id,
        provider,
        name,
        description,
        apiEndpoint,
        apiKey, // TODO: Encrypt this in production
        apiSecret, // TODO: Encrypt this in production
        webhookUrl,
        syncLeads: syncLeads ?? true,
        syncSales: syncSales ?? true,
        syncSchedule: syncSchedule ?? true,
        syncCustomers: syncCustomers ?? true,
        isActive: false // Start inactive until tested
      }
    });

    console.log(`✅ [CRM INTEGRATIONS POST] Created integration: ${integration.id}`);

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("❌ [CRM INTEGRATIONS POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create CRM integration" },
      { status: 500 }
    );
  }
}
