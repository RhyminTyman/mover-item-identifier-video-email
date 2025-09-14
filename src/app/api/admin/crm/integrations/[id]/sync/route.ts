import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Sync CRM integration data
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
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

    // Get the integration
    const integration = await prisma.crmIntegration.findFirst({
      where: {
        id: params.id,
        companyId: dbUser.company.id
      }
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    if (!integration.isActive) {
      return NextResponse.json({ error: "Integration is not active" }, { status: 400 });
    }

    // Update last sync time
    await prisma.crmIntegration.update({
      where: { id: params.id },
      data: { lastSyncAt: new Date() }
    });

    // TODO: Implement actual CRM sync logic based on provider
    // For now, we'll simulate the sync process
    const syncResults = await simulateCrmSync(integration);

    console.log(`✅ [CRM SYNC] Synced integration: ${params.id}`, syncResults);

    return NextResponse.json({
      message: "CRM data synced successfully",
      results: syncResults
    });
  } catch (error) {
    console.error("❌ [CRM SYNC] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync CRM integration" },
      { status: 500 }
    );
  }
}

// Simulate CRM sync based on provider
async function simulateCrmSync(integration: {
  id: string;
  provider: string;
  syncLeads: boolean;
  syncSales: boolean;
  syncSchedule: boolean;
}) {
  const results = {
    leads: { synced: 0, created: 0, updated: 0 },
    sales: { synced: 0, created: 0, updated: 0 },
    schedules: { synced: 0, created: 0, updated: 0 }
  };

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock sync data based on provider
    const mockData = getMockCrmData(integration.provider);

    if (integration.syncLeads) {
      // Sync leads
      for (const leadData of mockData.leads) {
        const existingLead = await prisma.crmLead.findFirst({
          where: {
            integrationId: integration.id,
            crmLeadId: leadData.crmLeadId
          }
        });

        if (existingLead) {
          await prisma.crmLead.update({
            where: { id: existingLead.id },
            data: {
              ...leadData,
              lastSyncedAt: new Date()
            }
          });
          results.leads.updated++;
        } else {
          await prisma.crmLead.create({
            data: {
              integrationId: integration.id,
              ...leadData,
              lastSyncedAt: new Date()
            }
          });
          results.leads.created++;
        }
        results.leads.synced++;
      }
    }

    if (integration.syncSales) {
      // Sync sales
      for (const saleData of mockData.sales) {
        const existingSale = await prisma.crmSale.findFirst({
          where: {
            integrationId: integration.id,
            crmSaleId: saleData.crmSaleId
          }
        });

        if (existingSale) {
          await prisma.crmSale.update({
            where: { id: existingSale.id },
            data: {
              ...saleData,
              lastSyncedAt: new Date()
            }
          });
          results.sales.updated++;
        } else {
          await prisma.crmSale.create({
            data: {
              integrationId: integration.id,
              ...saleData,
              lastSyncedAt: new Date()
            }
          });
          results.sales.created++;
        }
        results.sales.synced++;
      }
    }

    if (integration.syncSchedule) {
      // Sync schedules
      for (const scheduleData of mockData.schedules) {
        const existingSchedule = await prisma.crmSchedule.findFirst({
          where: {
            integrationId: integration.id,
            crmScheduleId: scheduleData.crmScheduleId
          }
        });

        if (existingSchedule) {
          await prisma.crmSchedule.update({
            where: { id: existingSchedule.id },
            data: {
              ...scheduleData,
              lastSyncedAt: new Date()
            }
          });
          results.schedules.updated++;
        } else {
          await prisma.crmSchedule.create({
            data: {
              integrationId: integration.id,
              ...scheduleData,
              lastSyncedAt: new Date()
            }
          });
          results.schedules.created++;
        }
        results.schedules.synced++;
      }
    }

  } catch (error) {
    console.error("Error in simulateCrmSync:", error);
    throw error;
  }

  return results;
}

// Generate mock CRM data based on provider
function getMockCrmData(provider: string) {
  const baseLeads = [
    {
      crmLeadId: `${provider}_lead_1`,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@email.com",
      phone: "+1-555-0123",
      source: "Website",
      status: "new",
      priority: "high",
      estimatedValue: 2500.00,
      moveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      originAddress: "123 Main St, New York, NY",
      destinationAddress: "456 Oak Ave, Los Angeles, CA",
      moveType: "residential"
    },
    {
      crmLeadId: `${provider}_lead_2`,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1-555-0456",
      source: "Referral",
      status: "contacted",
      priority: "medium",
      estimatedValue: 1800.00,
      moveDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      originAddress: "789 Pine St, Chicago, IL",
      destinationAddress: "321 Elm St, Chicago, IL",
      moveType: "local"
    }
  ];

  const baseSales = [
    {
      crmSaleId: `${provider}_sale_1`,
      opportunityName: "John Smith Residential Move",
      stage: "proposal",
      probability: 75,
      estimatedValue: 2500.00,
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: "High-value residential move, customer very interested"
    },
    {
      crmSaleId: `${provider}_sale_2`,
      opportunityName: "Sarah Johnson Local Move",
      stage: "negotiation",
      probability: 60,
      estimatedValue: 1800.00,
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: "Local move, price-sensitive customer"
    }
  ];

  const baseSchedules = [
    {
      crmScheduleId: `${provider}_schedule_1`,
      title: "Site Visit - John Smith",
      description: "Initial site visit to assess moving requirements",
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      location: "123 Main St, New York, NY",
      type: "site-visit",
      status: "scheduled",
      priority: "high",
      attendees: [
        { name: "John Smith", email: "john.smith@email.com", role: "customer" },
        { name: "Mike Davis", email: "mike.davis@company.com", role: "sales-rep" }
      ]
    },
    {
      crmScheduleId: `${provider}_schedule_2`,
      title: "Follow-up Call - Sarah Johnson",
      description: "Follow-up call to discuss moving details",
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 minutes later
      type: "follow-up",
      status: "scheduled",
      priority: "medium",
      attendees: [
        { name: "Sarah Johnson", email: "sarah.johnson@email.com", role: "customer" },
        { name: "Lisa Brown", email: "lisa.brown@company.com", role: "sales-rep" }
      ]
    }
  ];

  return {
    leads: baseLeads,
    sales: baseSales,
    schedules: baseSchedules
  };
}
