import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user to mark as onboarded
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: { onboarded: true },
    });

    return NextResponse.json({ 
      success: true, 
      onboarded: updatedUser.onboarded 
    });

  } catch (error) {
    console.error("Error marking user as onboarded:", error);
    return NextResponse.json(
      { error: "Failed to mark user as onboarded" },
      { status: 500 }
    );
  }
}
