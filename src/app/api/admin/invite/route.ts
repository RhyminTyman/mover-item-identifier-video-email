import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/user";
import { sendInviteEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or company-admin
    const userRole = await getUserRole(userId);
    if (userRole !== "admin" && userRole !== "company-admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { email, firstName, lastName, role, message, companyInfo } = await req.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ 
        error: "Missing required fields: email, firstName, lastName, role" 
      }, { status: 400 });
    }

    // Validate company info for company-admin role
    if (role === "company-admin" && !companyInfo) {
      return NextResponse.json({ 
        error: "Company information is required for company-admin role" 
      }, { status: 400 });
    }

    if (role === "company-admin" && (!companyInfo.name || !companyInfo.address || !companyInfo.city || !companyInfo.state || !companyInfo.zipCode)) {
      return NextResponse.json({ 
        error: "Missing required company fields: name, address, city, state, zipCode" 
      }, { status: 400 });
    }

    // Validate role
    if (!["sales", "admin", "company-admin"].includes(role)) {
      return NextResponse.json({ 
        error: "Invalid role. Must be 'sales', 'admin', or 'company-admin'" 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "User with this email already exists" 
      }, { status: 409 });
    }

    // Handle company creation for company-admin role
    let companyId = null;
    if (role === "company-admin") {
      // Check if company already exists
      const existingCompany = await prisma.company.findFirst({
        where: { 
          name: companyInfo.name,
          address: companyInfo.address,
          city: companyInfo.city,
          state: companyInfo.state,
          zipCode: companyInfo.zipCode
        }
      });

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // Create new company
        const newCompany = await prisma.company.create({
          data: {
            name: companyInfo.name,
            address: companyInfo.address,
            city: companyInfo.city,
            state: companyInfo.state,
            zipCode: companyInfo.zipCode,
            phone: companyInfo.phone || null,
            email: companyInfo.email || null,
            website: companyInfo.website || null,
            // Set default pricing values
            baseCostPerHour: companyInfo.baseCostPerHour || 50.0,
            costPerMile: companyInfo.costPerMile || 2.0,
            costPerCubicFoot: companyInfo.costPerCubicFoot || 0.5,
            costPerPound: companyInfo.costPerPound || 0.1,
            stairCostPerFlight: companyInfo.stairCostPerFlight || 10.0,
            packingCostPerBox: companyInfo.packingCostPerBox || 5.0,
            unpackingCostPerBox: companyInfo.unpackingCostPerBox || 3.0,
            disposalCost: companyInfo.disposalCost || 25.0,
            storageCostPerDay: companyInfo.storageCostPerDay || 10.0,
            rushServiceMultiplier: companyInfo.rushServiceMultiplier || 1.5,
            taxRate: companyInfo.taxRate || 8.0
          }
        });
        companyId = newCompany.id;
      }
    }

    // Send invitation email
    const inviteResult = await sendInviteEmail({
      email,
      firstName,
      lastName,
      role,
      message: message || "",
      companyInfo: role === "company-admin" ? companyInfo : undefined
    });

    if (!inviteResult.success) {
      // If email fails but company was created, still return success with warning
      if (companyId) {
        return NextResponse.json({ 
          success: true, 
          message: "User and company created successfully, but email sending failed. Please contact the user directly.",
          companyId: companyId,
          emailWarning: true,
          emailError: inviteResult.error
        });
      }
      
      return NextResponse.json({ 
        error: "Failed to send invitation email: " + (inviteResult.error || "Unknown error")
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invitation sent successfully",
      companyId: companyId
    });

  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
