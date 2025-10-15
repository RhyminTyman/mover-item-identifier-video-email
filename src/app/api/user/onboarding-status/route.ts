import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { onboarded: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ onboarded: false });
    }

    return NextResponse.json({
      onboarded: user.onboarded,
      role: user.role
    });

  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json({ 
      error: "Failed to check onboarding status" 
    }, { status: 500 });
  }
}

