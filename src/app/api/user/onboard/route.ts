import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    console.log('🔍 [ONBOARD] Starting onboarding process...');
    const { userId } = await auth();
    
    console.log('🔍 [ONBOARD] User ID from auth:', userId);
    
    if (!userId) {
      console.error('❌ [ONBOARD] No user ID found - unauthorized');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🔍 [ONBOARD] Looking for user with clerkId:', userId);
    
    // First check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    console.log('🔍 [ONBOARD] Existing user found:', !!existingUser);

    if (!existingUser) {
      console.error('❌ [ONBOARD] User not found in database with clerkId:', userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user to mark as onboarded
    console.log('🔍 [ONBOARD] Updating user onboarded status...');
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: { onboarded: true },
    });

    console.log('✅ [ONBOARD] User onboarded successfully:', updatedUser.onboarded);

    return NextResponse.json({ 
      success: true, 
      onboarded: updatedUser.onboarded 
    });

  } catch (error) {
    console.error("❌ [ONBOARD] Error marking user as onboarded:", error);
    return NextResponse.json(
      { error: "Failed to mark user as onboarded" },
      { status: 500 }
    );
  }
}
