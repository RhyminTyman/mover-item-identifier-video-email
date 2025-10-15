import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role, companyName, phoneNumber } = body;

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      // This shouldn't happen, but create user if doesn't exist
      return NextResponse.json({ 
        error: "User not found. Please sign in again." 
      }, { status: 404 });
    }

    // If company-admin role, create company
    let companyId = user.companyId;
    if (role === 'company-admin' && companyName) {
      // Check if company already exists
      if (!companyId) {
        const company = await prisma.company.create({
          data: {
            name: companyName,
            address: '',
            city: '',
            state: '',
            zipCode: '',
            phone: phoneNumber || ''
          }
        });
        companyId = company.id;
      }
    }

    // Update user with onboarding data
    user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        role: role || 'customer',
        onboarded: true,
        companyId: companyId,
        updatedAt: new Date()
      }
    });

    // TODO: Send welcome email
    // await sendWelcomeEmail(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        onboarded: user.onboarded,
        companyId: user.companyId
      }
    });

  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json({ 
      error: "Failed to complete onboarding",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

