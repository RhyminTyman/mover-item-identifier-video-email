import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { notifyAccountDeletionRequest } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * Delete user account (GDPR compliance)
 * Soft delete - marks as inactive and anonymizes data
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reason, confirmEmail } = body;

    // Get user data
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify email confirmation
    if (confirmEmail !== user.email) {
      return NextResponse.json({ 
        error: "Email confirmation does not match" 
      }, { status: 400 });
    }

    // Prevent deletion of admin accounts through this endpoint
    if (user.role === 'admin') {
      return NextResponse.json({ 
        error: "Admin accounts cannot be deleted through this endpoint. Please contact support." 
      }, { status: 403 });
    }

    logger.info('Account deletion requested', {
      userId: user.id,
      userEmail: user.email,
      reason,
      component: 'account_deletion'
    });

    // Notify admins
    await notifyAccountDeletionRequest(user.id, user.email, reason);

    // Soft delete: Anonymize user data
    const anonymizedEmail = `deleted_${user.id}@deleted.local`;
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        email: anonymizedEmail,
        firstName: 'Deleted',
        lastName: 'User',
        isActive: false,
        // Keep clerkId for referential integrity
        // Actual Clerk account will be deleted separately
      }
    });

    // Delete from Clerk
    try {
      const clerk = await clerkClient();
      await clerk.users.deleteUser(userId);
      logger.info('Clerk account deleted', { userId: user.id });
    } catch (clerkError) {
      logger.error('Failed to delete Clerk account', clerkError as Error, {
        userId: user.id,
        component: 'account_deletion'
      });
      // Continue even if Clerk deletion fails
    }

    logger.info('Account deletion completed', {
      userId: user.id,
      component: 'account_deletion'
    });

    return NextResponse.json({
      success: true,
      message: "Your account has been deleted. We're sorry to see you go."
    });

  } catch (error) {
    logger.error('Account deletion failed', error as Error, { component: 'account_deletion' });
    return NextResponse.json({ 
      error: "Failed to delete account",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

