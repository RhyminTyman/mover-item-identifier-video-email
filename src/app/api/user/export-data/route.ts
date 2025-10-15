import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { notifyDataExportRequest } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * Export user data (GDPR compliance)
 * Returns all user data in JSON format
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info('Data export requested', { userId, component: 'data_export' });

    // Get user data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        company: true,
        inventories: {
          include: {
            items: true,
            photos: true
          }
        },
        addresses: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Notify admins about data export request
    await notifyDataExportRequest(user.id, user.email);

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: 'GDPR_DATA_EXPORT',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        onboarded: user.onboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      company: user.company ? {
        id: user.company.id,
        name: user.company.name,
        address: user.company.address,
        city: user.company.city,
        state: user.company.state,
        zipCode: user.company.zipCode,
        phone: user.company.phone,
        email: user.company.email,
        website: user.company.website
      } : null,
      inventories: user.inventories.map(inv => ({
        id: inv.id,
        title: inv.title,
        note: inv.note,
        status: inv.status,
        createdAt: inv.createdAt,
        moveDate: inv.moveDate,
        totalCost: inv.totalCost,
        items: inv.items.map(item => ({
          id: item.id,
          shortName: item.shortName,
          description: item.description,
          notes: item.notes,
          dimensions: {
            length: item.lengthIn,
            width: item.widthIn,
            height: item.heightIn
          },
          count: item.count,
          tags: item.tags,
          roomName: item.roomName,
          createdAt: item.createdAt
        })),
        photos: inv.photos.map(photo => ({
          id: photo.id,
          filename: photo.filename,
          url: photo.url,
          roomName: photo.roomName,
          createdAt: photo.createdAt
        }))
      })),
      addresses: user.addresses.map(addr => ({
        id: addr.id,
        street1: addr.street1,
        street2: addr.street2,
        city: addr.city,
        stateId: addr.stateId,
        zipCode: addr.zipCode,
        country: addr.country,
        createdAt: addr.createdAt
      })),
      metadata: {
        totalInventories: user.inventories.length,
        totalItems: user.inventories.reduce((sum, inv) => sum + inv.items.length, 0),
        totalPhotos: user.inventories.reduce((sum, inv) => sum + inv.photos.length, 0),
        accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + ' days'
      }
    };

    logger.info('Data export completed', {
      userId,
      component: 'data_export',
      inventoryCount: exportData.inventories.length,
      itemCount: exportData.metadata.totalItems
    });

    // Return as downloadable JSON file
    const filename = `barreleyes-data-export-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    logger.error('Data export failed', error as Error, { component: 'data_export' });
    return NextResponse.json({ 
      error: "Failed to export data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

