import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const currentUserRole = await getUserRole(userId);
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: "Only admins can impersonate users" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Verify target user exists and is a company-admin
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { company: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetUser.role !== 'company-admin') {
      return NextResponse.json({ error: "Can only impersonate company admins" }, { status: 400 });
    }

    // Create impersonation session
    const impersonationData = {
      originalUserId: userId,
      impersonatedUserId: targetUserId,
      impersonatedUserName: `${targetUser.firstName} ${targetUser.lastName}`,
      companyName: targetUser.company?.name || 'Unknown Company',
      startedAt: new Date().toISOString()
    };

    // Store impersonation data in a secure way (you might want to use Redis or database)
    // For now, we'll return the data and let the client handle it
    return NextResponse.json({
      success: true,
      impersonationData,
      message: `Now impersonating ${targetUser.firstName} ${targetUser.lastName} from ${targetUser.company?.name}`
    });

  } catch (error) {
    console.error("Error in impersonation:", error);
    return NextResponse.json({ 
      error: "Failed to start impersonation", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // End impersonation - just return success
    // The client should clear any impersonation state
    return NextResponse.json({
      success: true,
      message: "Impersonation ended"
    });

  } catch (error) {
    console.error("Error ending impersonation:", error);
    return NextResponse.json({ 
      error: "Failed to end impersonation", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
