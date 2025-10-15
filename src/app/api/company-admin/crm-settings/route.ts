import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is company admin
    const userRole = await getUserRole(userId);
    if (userRole !== 'company-admin') {
      return NextResponse.json({ error: "Only company admins can access CRM settings" }, { status: 403 });
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get CRM integration settings
    const crmIntegration = await prisma.crmIntegration.findFirst({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });

    if (!crmIntegration) {
      // Return default settings if none exist
      return NextResponse.json({
        settings: {
          provider: 'none',
          enabled: false,
          apiKey: '',
          apiSecret: '',
          webhookUrl: '',
          syncEnabled: false,
          autoCreateLeads: true,
          autoUpdateStatus: true,
          customFields: {},
          connectionStatus: 'unknown'
        }
      });
    }

    // Map database fields to component fields
    const settings = {
      id: crmIntegration.id,
      provider: crmIntegration.provider,
      enabled: crmIntegration.isActive,
      apiKey: crmIntegration.apiKey || '',
      apiSecret: crmIntegration.apiSecret || '',
      webhookUrl: crmIntegration.webhookUrl || '',
      syncEnabled: crmIntegration.syncLeads,
      autoCreateLeads: crmIntegration.syncLeads,
      autoUpdateStatus: crmIntegration.syncSales,
      customFields: (crmIntegration.settings as Record<string, string>) || {},
      lastSyncAt: crmIntegration.lastSyncAt?.toISOString(),
      connectionStatus: crmIntegration.isActive ? 'connected' : 'disconnected'
    };

    return NextResponse.json({ settings });

  } catch (error) {
    console.error("Error fetching CRM settings:", error);
    return NextResponse.json({ 
      error: "Failed to fetch CRM settings", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is company admin
    const userRole = await getUserRole(userId);
    if (userRole !== 'company-admin') {
      return NextResponse.json({ error: "Only company admins can update CRM settings" }, { status: 403 });
    }

    const body = await req.json();
    const {
      provider,
      enabled,
      apiKey,
      apiSecret,
      webhookUrl,
      syncEnabled,
      autoCreateLeads,
      autoUpdateStatus,
      customFields
    } = body;

    // Get user's company ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if CRM integration already exists
    const existingIntegration = await prisma.crmIntegration.findFirst({
      where: { companyId: user.companyId }
    });

    const integrationData = {
      provider: provider || 'none',
      name: provider ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration` : 'No Integration',
      isActive: enabled || false,
      apiKey: apiKey || null,
      apiSecret: apiSecret || null,
      webhookUrl: webhookUrl || null,
      syncLeads: syncEnabled || autoCreateLeads || false,
      syncSales: syncEnabled || autoUpdateStatus || false,
      syncCustomers: syncEnabled || false,
      settings: customFields || {},
    };

    let crmIntegration;
    if (existingIntegration) {
      // Update existing integration
      crmIntegration = await prisma.crmIntegration.update({
        where: { id: existingIntegration.id },
        data: integrationData
      });
    } else {
      // Create new integration
      crmIntegration = await prisma.crmIntegration.create({
        data: {
          ...integrationData,
          companyId: user.companyId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "CRM settings saved successfully",
      settings: {
        id: crmIntegration.id,
        provider: crmIntegration.provider,
        enabled: crmIntegration.isActive,
        apiKey: crmIntegration.apiKey || '',
        apiSecret: crmIntegration.apiSecret || '',
        webhookUrl: crmIntegration.webhookUrl || '',
        syncEnabled: crmIntegration.syncLeads,
        autoCreateLeads: crmIntegration.syncLeads,
        autoUpdateStatus: crmIntegration.syncSales,
        customFields: crmIntegration.settings as Record<string, string> || {},
        connectionStatus: crmIntegration.isActive ? 'connected' : 'disconnected'
      }
    });

  } catch (error) {
    console.error("Error saving CRM settings:", error);
    return NextResponse.json({ 
      error: "Failed to save CRM settings", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
